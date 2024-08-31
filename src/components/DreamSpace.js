import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import DreamGraph from './DreamGraph';
import { scanDreamVault } from '../services/electronService';
import DreamNode from './DreamNode';
import ReactDOM from 'react-dom';

const DreamSpace = () => {
  const refContainer = useRef(null);
  const [dreamNodes, setDreamNodes] = useState([]);
  const [error, setError] = useState(null);

  const sceneState = useMemo(() => {
    if (!refContainer.current) {
      setError('Container ref is not available');
      return null;
    }

    if (!WebGL.isWebGLAvailable()) {
      setError('WebGL is not available: ' + WebGL.getWebGLErrorMessage());
      return null;
    }

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
      camera.position.z = 2000;

      const cssRenderer = new CSS3DRenderer();
      cssRenderer.setSize(window.innerWidth, window.innerHeight);
      cssRenderer.domElement.style.position = 'absolute';
      cssRenderer.domElement.style.top = '0';
      refContainer.current.appendChild(cssRenderer.domElement);

      const controls = new OrbitControls(camera, cssRenderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.enableZoom = true;

      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        cssRenderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener('resize', handleResize);

      return {
        scene,
        camera,
        cssRenderer,
        controls,
        cleanup: () => {
          window.removeEventListener('resize', handleResize);
          cssRenderer.domElement.parentNode.removeChild(cssRenderer.domElement);
          controls.dispose();
        }
      };
    } catch (error) {
      setError('Error initializing scene: ' + error.message);
      return null;
    }
  }, []);

  useEffect(() => {
    if (sceneState) {
      const fetchFirstDreamNode = async () => {
        try {
          const repos = await scanDreamVault();
          if (repos.length > 0) {
            setDreamNodes([{ repoName: repos[0] }]);
          } else {
            setError('No repositories found in the DreamVault');
          }
        } catch (error) {
          setError('Error scanning dream vault: ' + error.message);
        }
      };

      fetchFirstDreamNode();

      return () => {
        sceneState.cleanup();
      };
    }
  }, [sceneState]);

  const dreamNodeRef = useRef(null);

  useEffect(() => {
    if (sceneState && dreamNodes.length > 0) {
      console.log('Rendering DreamNode in DreamSpace');
      const { scene } = sceneState;
      // Clear existing nodes
      scene.children = scene.children.filter(child => !(child instanceof CSS3DObject));
      console.log('Cleared existing nodes. Scene children count:', scene.children.length);
      
      // Add the single DreamNode
      const dreamNode = dreamNodes[0];
      const nodeElement = document.createElement('div');
      nodeElement.style.width = '300px';
      nodeElement.style.height = '300px';
      
      ReactDOM.render(
        <DreamNode 
          ref={dreamNodeRef}
          repoName={dreamNode.repoName} 
          initialPosition={new THREE.Vector3(0, 0, -1000)}
          cssScene={scene}
          onNodeClick={(repoName) => console.log('Node clicked:', repoName)}
        />, 
        nodeElement,
        () => {
          console.log('DreamNode rendered to nodeElement');
          // Ensure the DreamNode is added to the scene
          if (dreamNodeRef.current && dreamNodeRef.current.css3DObject) {
            scene.add(dreamNodeRef.current.css3DObject);
            console.log('Added DreamNode to scene. Scene children count:', scene.children.length);
          } else {
            console.log('Failed to add DreamNode to scene. dreamNodeRef.current:', dreamNodeRef.current);
          }
        }
      );
    } else {
      console.log('Not rendering DreamNode. sceneState:', !!sceneState, 'dreamNodes length:', dreamNodes.length);
    }
  }, [sceneState, dreamNodes]);

  useEffect(() => {
    if (sceneState) {
      const { scene, camera, cssRenderer, controls } = sceneState;

      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        cssRenderer.render(scene, camera);
      };

      animate();
    }
  }, [sceneState]);

  const handleNodeClick = useCallback((repoName) => {
    console.log('Node clicked:', repoName);
    // Add any additional logic for node click here
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div ref={refContainer}>
      {(!sceneState || dreamNodes.length === 0) && (
        <div style={{ color: 'white', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          Loading...
        </div>
      )}
    </div>
  );
};

export default DreamSpace;
