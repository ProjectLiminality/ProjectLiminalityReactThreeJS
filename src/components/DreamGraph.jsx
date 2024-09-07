import React, { useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import DreamNode3DR3F from './DreamNode3DR3F';

const DreamGraph = ({ initialNodes, onOpenMetadataPanel }) => {
  const [nodes, setNodes] = useState(initialNodes);
  const [hoveredNode, setHoveredNode] = useState(null);

  const positionNodesOnGrid = useCallback(() => {
    const gridSize = Math.ceil(Math.sqrt(nodes.length));
    const spacing = 200;
    
    setNodes(prevNodes => prevNodes.map((node, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      return {
        ...node,
        position: new THREE.Vector3(
          (col - gridSize / 2) * spacing,
          (row - gridSize / 2) * spacing,
          0
        )
      };
    }));
  }, [nodes.length]);

  useEffect(() => {
    positionNodesOnGrid();
  }, [positionNodesOnGrid]);

  const updateNodePositions = useCallback((clickedNodeIndex) => {
    setNodes(prevNodes => {
      const clickedNode = prevNodes[clickedNodeIndex];
      const otherNodes = prevNodes.filter((_, index) => index !== clickedNodeIndex);
      
      // Randomly select related nodes (between 1 and half of the remaining nodes)
      const relatedCount = Math.floor(Math.random() * (otherNodes.length / 2)) + 1;
      const relatedNodes = otherNodes.slice(0, relatedCount);
      const unrelatedNodes = otherNodes.slice(relatedCount);

      // Set up circles
      const relatedCircleRadius = 300;
      const unrelatedCircleRadius = 2000; // Outside field of view

      // Position clicked node at origin
      clickedNode.position.set(0, 0, 0);

      // Position related nodes
      relatedNodes.forEach((node, index) => {
        const angle = (index / relatedCount) * Math.PI * 2;
        node.position.set(
          Math.cos(angle) * relatedCircleRadius,
          Math.sin(angle) * relatedCircleRadius,
          0
        );
      });

      // Position unrelated nodes
      unrelatedNodes.forEach((node, index) => {
        const angle = (index / unrelatedNodes.length) * Math.PI * 2;
        node.position.set(
          Math.cos(angle) * unrelatedCircleRadius,
          Math.sin(angle) * unrelatedCircleRadius,
          0
        );
      });

      return [clickedNode, ...relatedNodes, ...unrelatedNodes];
    });
  }, []);

  const handleNodeClick = useCallback((repoName) => {
    const clickedNodeIndex = nodes.findIndex(node => node.repoName === repoName);
    if (clickedNodeIndex !== -1) {
      updateNodePositions(clickedNodeIndex);
    }
    console.log('Node clicked:', repoName);
    onOpenMetadataPanel(repoName);
  }, [nodes, updateNodePositions, onOpenMetadataPanel]);

  return (
    <>
      {nodes.map((node, index) => (
        <DreamNode3DR3F
          key={node.repoName}
          repoName={node.repoName}
          position={node.position}
          onNodeClick={handleNodeClick}
          isHovered={hoveredNode === node.repoName}
          setHoveredNode={setHoveredNode}
          index={index}
        />
      ))}
    </>
  );
};

export default DreamGraph;
