import React from 'react';
import { MS_PAINT_COLORS } from '../utils/canvasUtils';
import '../styles/retro.css';

interface ColorPaletteProps {
  primaryColor: string;
  secondaryColor: string;
  onPrimaryColorChange: (color: string) => void;
  onSecondaryColorChange: (color: string) => void;
  className?: string;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  primaryColor,
  secondaryColor,
  onPrimaryColorChange,
  onSecondaryColorChange,
  className = '',
}) => {
  const handleColorClick = (color: string, event: React.MouseEvent) => {
    // Left click sets primary color, right click sets secondary color
    if (event.button === 0) {
      onPrimaryColorChange(color);
    } else if (event.button === 2) {
      onSecondaryColorChange(color);
    }
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault(); // Prevent browser context menu
  };

  return (
    <div className={`color-palette-container ${className}`}>
      {/* Current color display */}
      <div className="current-colors">
        <div className="color-display">
          <div
            className="primary-color-display"
            style={{
              backgroundColor: primaryColor,
              width: '24px',
              height: '24px',
              border: '2px inset #c0c0c0',
              position: 'relative',
              zIndex: 2,
            }}
            title={`Primary color: ${primaryColor}`}
          />
          <div
            className="secondary-color-display"
            style={{
              backgroundColor: secondaryColor,
              width: '24px',
              height: '24px',
              border: '2px inset #c0c0c0',
              position: 'relative',
              marginLeft: '-8px',
              marginTop: '8px',
              zIndex: 1,
            }}
            title={`Secondary color: ${secondaryColor}`}
          />
        </div>
      </div>

      {/* Color palette grid */}
      <div className="color-palette">
        {MS_PAINT_COLORS.map((color, index) => (
          <button
            key={color}
            className={`color-button ${
              color === primaryColor ? 'active primary' : 
              color === secondaryColor ? 'active secondary' : ''
            }`}
            style={{ backgroundColor: color }}
            onClick={(e) => handleColorClick(color, e)}
            onMouseDown={(e) => handleColorClick(color, e)}
            onContextMenu={handleContextMenu}
            title={`Color: ${color}`}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>

      {/* Instructions */}
      <div className="color-instructions">
        <div style={{ 
          fontSize: '10px', 
          color: '#000', 
          marginTop: '4px',
          fontFamily: 'MS Sans Serif, sans-serif'
        }}>
          Left click: Primary | Right click: Secondary
        </div>
      </div>
    </div>
  );
};

export default ColorPalette;