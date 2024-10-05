import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Billboard, Html } from '@react-three/drei';
import gsap from 'gsap';
import DreamTalk from './DreamTalk';
import DreamSong from './DreamSong';
import { BLUE, RED } from '../constants/colors';
import { useThree } from '@react-three/fiber';

const DreamNode = ({ repoName, position, scale, metadata, dreamTalkMedia, dreamSongMedia, onNodeClick, onNodeRightClick, setHoveredNode, isCentered, onDrop }) => {
  const { camera } = useThree();
  const firstDreamSongMedia = dreamSongMedia && dreamSongMedia.length > 0 ? dreamSongMedia[0] : null;
  const [hovered, setHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const nodeRef = useRef();
  const groupRef = useRef();

  const handleFlip = useCallback(() => {
    setIsFlipped(prevState => {
      const newState = !prevState;
      gsap.to(groupRef.current.rotation, {
        y: newState ? Math.PI : 0,
        duration: 1,
        ease: "power2.inOut"
      });
      return newState;
    });
  }, []);

  useEffect(() => {
    if (!isCentered && isFlipped) {
      handleFlip();
    }
  }, [isCentered, isFlipped, handleFlip]);

  useEffect(() => {
    if (!isCentered) {
      setIsFlipped(false);
      gsap.to(groupRef.current.rotation, {
        y: 0,
        duration: 1,
        ease: "power2.inOut"
      });
    }
  }, [isCentered]);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
  }, [hovered]);

  useEffect(() => {
    if (nodeRef.current) {
      gsap.to(nodeRef.current.position, {
        x: position.x,
        y: position.y,
        z: position.z,
        duration: 2,
        ease: "power2.inOut"
      });
      gsap.to(nodeRef.current.scale, {
        x: scale,
        y: scale,
        z: scale,
        duration: .5,
        ease: "power2.out"
      });
    }
  }, [position, scale]);

  const borderColor = metadata?.type === 'person' ? RED : BLUE;

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    setHoveredNode(repoName);
    console.log(`Mouse entered DreamNode: ${repoName}`);
  }, [repoName, setHoveredNode]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setHoveredNode(null);
    console.log(`Mouse left DreamNode: ${repoName}`);
  }, [repoName, setHoveredNode]);

  const handleClick = (clickedRepoName) => {
    onNodeClick(clickedRepoName || repoName);
  };

  const handleRightClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onNodeRightClick(repoName, event);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onDrop(event, repoName);
  };

  return (
    <Billboard
      ref={nodeRef}
      follow={true}
      lockX={false}
      lockY={false}
      lockZ={false}
      onContextMenu={handleRightClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <group ref={groupRef}>
        <Html
          transform
          position={[0, 0, 0.01]}
          style={{
            width: '300px',
            height: '300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <DreamTalk 
            repoName={repoName}
            dreamTalkMedia={dreamTalkMedia}
            metadata={metadata}
            onClick={handleClick}
            onRightClick={handleRightClick}
            isHovered={hovered}
            borderColor={borderColor}
            onFlip={handleFlip}
          />
        </Html>
        <Html
          transform
          position={[0, 0, -0.01]}
          rotation={[0, Math.PI, 0]}
          style={{
            width: '300px',
            height: '300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <DreamSong 
            repoName={repoName}
            dreamSongMedia={dreamSongMedia}
            metadata={metadata}
            onClick={handleClick}
            onRightClick={handleRightClick}
            onFileRightClick={onNodeRightClick}
            isHovered={hovered}
            borderColor={borderColor}
            onFlip={handleFlip}
          />
        </Html>
      </group>
    </Billboard>
  );
};

export default DreamNode;
