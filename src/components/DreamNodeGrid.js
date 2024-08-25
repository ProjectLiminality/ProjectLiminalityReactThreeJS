import * as THREE from 'three';
import DreamNode from './DreamNode';
import { updatePosition } from '../utils/3DUtils';

class DreamNodeGrid {
  constructor({ scene, camera }) {
    this.scene = scene;
    this.camera = camera;
    this.dreamNodes = [];
    this.layouts = {
      grid: this.calculateGridPosition,
      circle: this.calculateCirclePosition,
      // Add more layouts as needed
    };
    this.currentLayout = 'grid';
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.init();
    this.addEventListeners();
    this.startAnimationLoop();
  }

  addEventListeners() {
    window.addEventListener('click', this.onClick.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
  }

  onClick(event) {
    this.updateMousePosition(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    
    for (let intersect of intersects) {
      let object = intersect.object;
      while (object.parent && !object.userData.dreamNode) {
        object = object.parent;
      }
      if (object.userData.dreamNode) {
        const clickedNode = object.userData.dreamNode;
        if (clickedNode.isInCenter()) {
          clickedNode.flip();
        } else {
          this.centerOnNode(clickedNode);
        }
        break;
      }
    }
  }

  centerOnNode(clickedNode) {
    const centerPosition = new THREE.Vector3(0, 0, 0);
    const offset = new THREE.Vector3().subVectors(centerPosition, clickedNode.position);

    this.dreamNodes.forEach(node => {
      const newPosition = new THREE.Vector3().addVectors(node.position, offset);
      node.updatePosition(newPosition);
    });
  }

  onMouseMove(event) {
    this.updateMousePosition(event);
  }

  checkHoverStates() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    
    this.dreamNodes.forEach(node => {
      const isHovered = intersects.some(intersect => {
        let object = intersect.object;
        while (object.parent && !object.userData.dreamNode) {
          object = object.parent;
        }
        return object.userData.dreamNode === node;
      });
      node.onHover(isHovered);
    });
  }

  updateMousePosition(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  async init() {
    console.log("Initializing DreamNodeGrid");
    if (window.electron) {
      const repos = await window.electron.scanDreamVault();
      console.log("Found repositories:", repos);
      await this.createDreamNodes(repos);
      this.addClickListeners();
    }
  }

  addClickListeners() {
    this.dreamNodes.forEach(node => {
      node.object.userData.onClick = () => this.centerNode(node);
    });
  }

  centerNode(centerNode) {
    const centerPosition = centerNode.object.position.clone();
    
    this.dreamNodes.forEach(node => {
      if (node !== centerNode) {
        const relativePosition = node.object.position.clone().sub(centerPosition);
        const newPosition = relativePosition.multiplyScalar(-1);
        node.updatePosition(newPosition, 1000);
      } else {
        node.updatePosition(new THREE.Vector3(0, 0, 0), 1000);
      }
    });

    // Update camera position
    const cameraOffset = new THREE.Vector3(0, 0, 10); // Adjust as needed
    const newCameraPosition = centerPosition.clone().add(cameraOffset);
    updatePosition(this.camera, newCameraPosition, 1000);
  }

  async createDreamNodes(repos) {
    this.dreamNodes = await Promise.all(repos.map(async (repoName, index) => {
      const position = this.layouts[this.currentLayout](index, repos.length);
      const dreamNode = new DreamNode({ scene: this.scene, position, repoName });
      this.scene.add(dreamNode.getObject());
      return dreamNode;
    }));
    console.log(`Created ${this.dreamNodes.length} DreamNodes`);
  }

  calculateGridPosition(index, total) {
    const hexRadius = 1.1; // Reduced spacing between nodes (half of the previous value)
    const columns = Math.ceil(Math.sqrt(total));
    const rows = Math.ceil(total / columns);

    const gridWidth = columns * hexRadius * 2;
    const gridHeight = rows * hexRadius * Math.sqrt(3);

    const startX = -gridWidth / 2;
    const startY = gridHeight / 2;

    const row = Math.floor(index / columns);
    const col = index % columns;
    const offset = row % 2 === 0 ? 0 : hexRadius;

    const x = startX + col * hexRadius * 2 + offset;
    const y = startY - row * hexRadius * Math.sqrt(3);

    return new THREE.Vector3(x, y, 0);
  }

  calculateCirclePosition(index, total) {
    const radius = Math.sqrt(total) * 1.5;
    const angle = (index / total) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return new THREE.Vector3(x, y, 0);
  }

  getDreamNodes() {
    return this.dreamNodes;
  }

  update() {
    this.checkHoverStates();
    this.dreamNodes.forEach(node => node.update());
    requestAnimationFrame(this.update.bind(this));
  }

  startAnimationLoop() {
    this.update();
  }

  changeLayout(newLayout) {
    if (this.layouts[newLayout]) {
      this.currentLayout = newLayout;
      this.updateNodePositions();
    } else {
      console.error(`Layout '${newLayout}' not found`);
    }
  }

  updateNodePositions() {
    this.dreamNodes.forEach((node, index) => {
      const newPosition = this.layouts[this.currentLayout](index, this.dreamNodes.length);
      node.updatePosition(newPosition);
    });
  }

  scaleNodes(scale) {
    this.dreamNodes.forEach(node => {
      node.updateScale(scale);
    });
  }
}

export default DreamNodeGrid;
