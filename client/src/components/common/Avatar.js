import React from 'react';
import './Avatar.css';

const Avatar = ({ 
  src, 
  name, 
  size = 40, 
  className = '', 
  onClick,
  style = {} 
}) => {
  const getInitial = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const avatarStyle = {
    width: size,
    height: size,
    ...style
  };

  return (
    <div 
      className={`avatar ${className}`} 
      style={avatarStyle}
      onClick={onClick}
    >
      {src ? (
        <img 
          src={src} 
          alt={name || 'User'} 
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div 
        className="avatar-fallback" 
        style={{ display: src ? 'none' : 'flex' }}
      >
        {getInitial(name)}
      </div>
    </div>
  );
};

export default Avatar;
