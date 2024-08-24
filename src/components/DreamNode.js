import React from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import DreamTalk from './DreamTalk';
import DreamSong from './DreamSong';

class DreamNode {
  constructor({ scene, position = new THREE.Vector3(0, 0, 0), repoName, isRed = false }) {
    this.repoName = repoName;
    this.scene = scene;
    this.position = position;
    this.isRed = isRed;
    this.object = new THREE.Object3D();
    this.isRotating = false;
    this.targetRotation = 0;
    this.yOffset = 0.06;
    this.isMoving = false;
    this.mediaContent = null;
    this.loadMediaContent();
    this.targetPosition = new THREE.Vector3();
    this.isScaling = false;
    this.targetScale = 1;
    this.currentScale = 1;
    this.startPosition = new THREE.Vector3();
    this.movementStartTime = 0;
    this.movementDuration = 1500;
    this.isHovered = false;

    this.init();
  }

  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  init() {
    console.log("Initializing DreamNode");
    this.createNode();
    this.addClickListener();
    console.log("DreamNode initialized");
  }

  createNode() {
    const radius = 1.4; // Reduced radius for smaller nodes
    const segments = 64;

    // Create a container for all parts of the node
    this.nodeContainer = new THREE.Object3D();

    // Create a circular disc
    const geometry = new THREE.CircleGeometry(radius, segments);
    const material = new THREE.MeshBasicMaterial({ 
      color: this.isRed ? 0xff0000 : 0x4287f5, 
      side: THREE.DoubleSide 
    });
    const disc = new THREE.Mesh(geometry, material);

    // Create hover effect ring
    const hoverGeometry = new THREE.RingGeometry(radius, radius + 0.2, segments);
    const hoverMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    this.hoverRing = new THREE.Mesh(hoverGeometry, hoverMaterial);

    const frontSide = this.createSide(DreamTalk, 0.01, { repoName: this.repoName });
    const backSide = this.createSide(DreamSong, -0.01);
    backSide.rotation.y = Math.PI;

    // Adjust the scale of the CSS3DObjects to match the disc size
    const scale = (radius * 2) / 400; // 400px is the width/height of the div
    frontSide.scale.set(scale, scale, scale);
    backSide.scale.set(scale, scale, scale);

    // Add all parts to the container
    this.nodeContainer.add(disc);
    this.nodeContainer.add(this.hoverRing);
    this.nodeContainer.add(frontSide);
    this.nodeContainer.add(backSide);

    // Set the position of the main object
    this.object.position.copy(this.position);

    // Add the container to the main object
    this.object.add(this.nodeContainer);
  }

  createSide(Component, zOffset, props = {}) {
    const div = document.createElement('div');
    div.style.width = '400px';
    div.style.height = '400px';
    div.style.borderRadius = '50%';
    div.style.overflow = 'hidden';

    const root = createRoot(div);
    root.render(React.createElement(Component, { ...props, mediaContent: this.mediaContent }));

    const object = new CSS3DObject(div);
    // Use the new yOffset variable for vertical positioning
    object.position.set(this.position.x, this.position.y - this.yOffset, this.position.z + zOffset);
    object.scale.set(0.01, 0.01, 0.01);

    return object;
  }

  addClickListener() {
    this.object.userData.clickable = true;
    this.scene.addEventListener('click', this.onNodeClick.bind(this));
    this.scene.addEventListener('mousemove', this.onMouseMove.bind(this));
  }

  onMouseMove(event) {
    const intersects = event.intersects;
    const hovered = intersects.some(intersect => intersect.object.parent === this.object);
  
    if (hovered && !this.isHovered) {
      this.isHovered = true;
      this.hoverRing.material.opacity = 0.5;
    } else if (!hovered && this.isHovered) {
      this.isHovered = false;
      this.hoverRing.material.opacity = 0;
    }
  }

  onNodeClick(event) {
    const intersects = event.intersects;
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      if (clickedObject.parent === this.object && !this.isRotating) {
        this.rotateNode();
      }
    }
  }

  rotateNode() {
    this.isRotating = true;
    this.rotationStartTime = Date.now();
    this.startRotation = this.object.rotation.y;
    this.targetRotation = this.startRotation + Math.PI;
  }

  update() {
    if (this.isRotating) {
      this.updateRotation();
    }

    if (this.isMoving) {
      this.updatePosition();
    }

    if (this.isScaling) {
      this.updateScale();
    }
  }

  updateScale(newScale) {
    if (!this.isScaling) {
      this.targetScale = newScale;
      this.scaleStartTime = Date.now();
      this.isScaling = true;
    }
  }

  updateScaleAnimation() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.scaleStartTime;
    const progress = Math.min(elapsedTime / this.movementDuration, 1);

    if (progress < 1) {
      const easedProgress = this.easeInOutCubic(progress);
      const newScale = this.currentScale + (this.targetScale - this.currentScale) * easedProgress;
      this.setScale(newScale);
    } else {
      this.setScale(this.targetScale);
      this.isScaling = false;
    }
  }

  setScale(scale) {
    this.currentScale = scale;
    this.nodeContainer.scale.set(scale, scale, scale);
    
    // Adjust CSS3DObject scales and positions
    this.nodeContainer.children.forEach(child => {
      if (child instanceof CSS3DObject) {
        child.scale.set(0.01 / scale, 0.01 / scale, 0.01 / scale);  // Adjust CSS3DObject scale
        const zOffset = child.position.z > 0 ? 0.01 : -0.01;
        child.position.set(0, -this.yOffset / scale, zOffset / scale);  // Adjust position relative to parent
      }
    });
  }

  getObject() {
    return this.object;
  }

  updatePosition(newPosition) {
    if (!this.isMoving) {
      this.startPosition.copy(this.object.position);
      this.targetPosition.copy(newPosition);
      this.movementStartTime = Date.now();
      this.isMoving = true;
    }
  }

  updatePositionAnimation() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.movementStartTime;
    const progress = Math.min(elapsedTime / this.movementDuration, 1);

    if (progress < 1) {
      const easedProgress = this.easeInOutCubic(progress);
      const newPosition = new THREE.Vector3().lerpVectors(
        this.startPosition,
        this.targetPosition,
        easedProgress
      );
      this.setPosition(newPosition);
    } else {
      this.setPosition(this.targetPosition);
      this.isMoving = false;
    }
  }

  setPosition(newPosition) {
    this.position.copy(newPosition);
    this.object.position.copy(newPosition);
    // Reset the nodeContainer's position to ensure it's centered on the object
    this.nodeContainer.position.set(0, 0, 0);
  }

  updateRotation() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.rotationStartTime;
    const progress = Math.min(elapsedTime / this.movementDuration, 1);

    if (progress < 1) {
      const easedProgress = this.easeInOutCubic(progress);
      const newRotation = this.startRotation + (this.targetRotation - this.startRotation) * easedProgress;
      this.nodeContainer.rotation.y = newRotation;
    } else {
      this.nodeContainer.rotation.y = this.targetRotation % (2 * Math.PI);
      this.isRotating = false;
    }
  }
  async loadMediaContent() {
    const mediaFormats = ['png', 'jpg', 'jpeg', 'gif', 'mp4'];
    for (const format of mediaFormats) {
      try {
        const response = await fetch(`/media/${this.repoName}.${format}`);
        if (response.ok) {
          this.mediaContent = {
            type: format === 'mp4' ? 'video' : 'image',
            url: `/media/${this.repoName}.${format}`
          };
          return; // Exit the function once media is found
        }
      } catch (error) {
        console.error(`Error loading media for ${this.repoName}:`, error);
      }
    }
    // If no media is found, set a default
    this.mediaContent = null;
    console.log(`No media found for ${this.repoName}`);
  }
}

export default DreamNode;
