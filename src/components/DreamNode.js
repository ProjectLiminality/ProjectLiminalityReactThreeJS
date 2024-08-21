import React from 'react';
import ReactDOM from 'react-dom';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import DreamTalk from './DreamTalk';
import DreamSong from './DreamSong';

class DreamNode {
  constructor({ scene, position = new THREE.Vector3(0, 0, 0) }) {
    this.scene = scene;
    this.position = position;
    this.object = new THREE.Object3D();
    this.discRef = null;
    this.frontRef = null;
    this.backRef = null;
    this.isRotating = false;
    this.targetRotation = 0;

    this.init();
  }

  init() {
    this.createDisc();
    this.createFrontElement();
    this.createBackElement();
    this.addClickListener();
  }

  createDisc() {
    const geometry = new THREE.CylinderGeometry(2, 2, 0.1, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0x4287f5 });  // Blue disc
    const disc = new THREE.Mesh(geometry, material);
    disc.rotation.x = Math.PI / 2; // Rotate 90 degrees around X-axis
    disc.position.copy(this.position);
    this.object.add(disc);
    this.discRef = disc;
  }

  addClickListener() {
    this.discRef.userData.clickable = true;
    this.scene.addEventListener('click', this.onNodeClick.bind(this));
  }

  onNodeClick(event) {
    const intersects = event.intersects;
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      if (clickedObject === this.discRef && !this.isRotating) {
        this.rotateNode();
      }
    }
  }

  rotateNode() {
    this.isRotating = true;
    this.targetRotation = this.object.rotation.y + Math.PI;
  }

  update() {
    if (this.isRotating) {
      const rotationSpeed = 0.1;
      this.object.rotation.y += rotationSpeed;
      if (Math.abs(this.object.rotation.y - this.targetRotation) < 0.1) {
        this.object.rotation.y = this.targetRotation;
        this.isRotating = false;
      }
    }
  }

  createHTMLElement(Component, position, rotation) {
    const div = document.createElement('div');
    div.style.width = '512px';
    div.style.height = '512px';
    div.style.background = 'rgba(0,0,0,0.1)';
    div.style.border = '1px solid white';
    
    ReactDOM.render(React.createElement(Component), div);

    const object = new CSS3DObject(div);
    object.position.copy(position);
    object.rotation.copy(rotation);
    object.scale.set(0.01, 0.01, 0.01); // Scale down to fit in the scene

    this.object.add(object);

    return { element: div, object: object };
  }

  createFrontElement() {
    this.frontRef = this.createHTMLElement(
      DreamTalk,
      new THREE.Vector3(0, 0, 0.051),
      new THREE.Euler(0, 0, 0)
    );
  }

  createBackElement() {
    this.backRef = this.createHTMLElement(
      DreamSong,
      new THREE.Vector3(0, 0, -0.051),
      new THREE.Euler(0, Math.PI, 0)
    );
  }

  getObject() {
    return this.object;
  }
}

export default DreamNode;
