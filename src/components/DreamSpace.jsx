import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import DreamGraph from './DreamGraph';
import CameraController from './CameraController';
import useDreamNodes from '../hooks/useDreamNodes';

const DreamSpace = ({ onNodeRightClick, onFileRightClick, dreamGraphRef, onDrop }) => {
  const { dreamNodes, error } = useDreamNodes();
  const [initialNodes, setInitialNodes] = useState([]);
  const [resetCamera, setResetCamera] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    if (dreamNodes.length > 0) {
      setInitialNodes(dreamNodes.map(node => ({
        ...node
      })));
    }
  }, [dreamNodes]);

  const handleOpenInFinder = (repoName) => {
    if (window.electron && window.electron.openInFinder) {
      window.electron.openInFinder(repoName);
    } else {
      // openInFinder is not available
    }
  };

  const handleNodeRightClick = (event, repoName) => {
    onNodeRightClick(repoName, event);
  };

  const onResetCamera = useCallback((resetFunc) => {
    setResetCamera(() => resetFunc);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && resetCamera) {
        resetCamera();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [resetCamera]);

  const handleHover = useCallback((repoName) => {
    setHoveredNode(repoName);
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, 100], fov: 75, near: 0.1, far: 3000 }}>
        <CameraController onResetCamera={onResetCamera} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        {initialNodes.length > 0 && (
          <DreamGraph 
            ref={dreamGraphRef}
            initialNodes={initialNodes} 
            onNodeRightClick={handleNodeRightClick}
            onFileRightClick={onFileRightClick}
            resetCamera={resetCamera}
            onDrop={onDrop}
          />
        )}
      </Canvas>
      {dreamNodes.length === 0 && (
        <div style={{ color: 'white', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          Loading...
        </div>
      )}
    </div>
  );
};

export default DreamSpace;
