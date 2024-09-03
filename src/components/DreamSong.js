import React from 'react';
import { BLUE, BLACK, WHITE } from '../constants/colors';

const DreamSong = ({ repoName, metadata, onClick, isHovered, borderColor }) => {
  return (
    <div 
      className="dream-song" 
      onClick={onClick}
      style={{
        alignItems: 'center',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0',
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
        backgroundColor: BLACK,
        borderRadius: '50%',
        border: `5px solid ${borderColor}`,
        color: WHITE,
      }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        borderRadius: '50%',
        overflow: 'hidden',
        background: isHovered ? 'rgba(0, 0, 0, 0.7)' : 'transparent',
        transition: 'background 0.3s ease',
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          margin: '10px 0', 
          padding: '5px', 
          textAlign: 'center',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          maxWidth: '100%',
        }}>
          {repoName}
        </h2>
        {metadata && (
          <>
            {metadata.dateCreated && (
              <p style={{ fontSize: '14px', margin: '5px 0', textAlign: 'center' }}>Created: {new Date(metadata.dateCreated).toLocaleDateString()}</p>
            )}
            {metadata.tags && metadata.tags.length > 0 && (
              <p style={{ fontSize: '14px', margin: '5px 0', textAlign: 'center' }}>Tags: {metadata.tags.join(', ')}</p>
            )}
            {metadata.aiPrompt && (
              <p style={{ 
                fontSize: '14px', 
                margin: '5px 0',
                maxHeight: '80px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                textAlign: 'center',
              }}>
                AI Prompt: {metadata.aiPrompt}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(DreamSong);
