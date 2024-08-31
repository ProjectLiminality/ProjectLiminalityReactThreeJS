import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import DreamNodeGrid from './DreamNodeGrid';
import { scanDreamVault } from '../services/electronService';

const ThreeScene = () => {
  const refContainer = useRef(null);
  const [dreamNodes, setDreamNodes] = useState([]);
  const [sceneState, setSceneState] = useState(null);
  const [error, setError] = useState(null);

  const initScene = useCallback(() => {
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
    const newSceneState = initScene();
    if (newSceneState) {
      setSceneState(newSceneState);

      const fetchDreamNodes = async () => {
        try {
          const repos = await scanDreamVault();
          const newDreamNodes = repos.map(repo => ({ repoName: repo }));
          setDreamNodes(newDreamNodes);
        } catch (error) {
          setError('Error scanning dream vault: ' + error.message);
        }
      };

      fetchDreamNodes();
    }

    return () => {
      if (newSceneState) {
        newSceneState.cleanup();
      }
    };
  }, [initScene]);

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
      {sceneState && dreamNodes.length > 0 && (
        <DreamNodeGrid
          cssScene={sceneState.scene}
          dreamNodes={dreamNodes}
          onNodeClick={handleNodeClick}
        />
      )}
      {(!sceneState || dreamNodes.length === 0) && (
        <div style={{ color: 'white', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          Loading...
        </div>
      )}
    </div>
  );
}

export default React.memo(ThreeScene);
