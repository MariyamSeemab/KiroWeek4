import React from 'react';
import type { DrawingTool } from '../types';
import '../styles/retro.css';

interface ToolPaletteProps {
  activeTool: DrawingTool;
  onToolSelect: (toolType: DrawingTool['type']) => void;
  className?: string;
}

// Pixelated SVG icons for tools (16x16 pixels)
const ToolIcons = {
  pencil: (
    <svg width="16" height="16" viewBox="0 0 16 16" className="pixelated-icon">
      <rect x="0" y="15" width="1" height="1" fill="#000"/>
      <rect x="1" y="14" width="1" height="1" fill="#000"/>
      <rect x="2" y="13" width="1" height="1" fill="#000"/>
      <rect x="3" y="12" width="1" height="1" fill="#000"/>
      <rect x="4" y="11" width="1" height="1" fill="#000"/>
      <rect x="5" y="10" width="1" height="1" fill="#000"/>
      <rect x="6" y="9" width="1" height="1" fill="#000"/>
      <rect x="7" y="8" width="1" height="1" fill="#000"/>
      <rect x="8" y="7" width="1" height="1" fill="#ffff00"/>
      <rect x="9" y="6" width="1" height="1" fill="#ffff00"/>
      <rect x="10" y="5" width="1" height="1" fill="#ffff00"/>
      <rect x="11" y="4" width="1" height="1" fill="#ffff00"/>
      <rect x="12" y="3" width="1" height="1" fill="#ffff00"/>
      <rect x="13" y="2" width="1" height="1" fill="#ffff00"/>
      <rect x="14" y="1" width="1" height="1" fill="#ff0000"/>
      <rect x="15" y="0" width="1" height="1" fill="#ff0000"/>
    </svg>
  ),
  brush: (
    <svg width="16" height="16" viewBox="0 0 16 16" className="pixelated-icon">
      <rect x="6" y="0" width="4" height="1" fill="#8B4513"/>
      <rect x="6" y="1" width="4" height="1" fill="#8B4513"/>
      <rect x="6" y="2" width="4" height="1" fill="#8B4513"/>
      <rect x="6" y="3" width="4" height="1" fill="#8B4513"/>
      <rect x="6" y="4" width="4" height="1" fill="#8B4513"/>
      <rect x="6" y="5" width="4" height="1" fill="#8B4513"/>
      <rect x="5" y="6" width="6" height="1" fill="#C0C0C0"/>
      <rect x="5" y="7" width="6" height="1" fill="#C0C0C0"/>
      <rect x="4" y="8" width="8" height="1" fill="#000"/>
      <rect x="4" y="9" width="8" height="1" fill="#000"/>
      <rect x="5" y="10" width="6" height="1" fill="#000"/>
      <rect x="5" y="11" width="6" height="1" fill="#000"/>
      <rect x="6" y="12" width="4" height="1" fill="#000"/>
      <rect x="6" y="13" width="4" height="1" fill="#000"/>
      <rect x="7" y="14" width="2" height="1" fill="#000"/>
      <rect x="7" y="15" width="2" height="1" fill="#000"/>
    </svg>
  ),
  eraser: (
    <svg width="16" height="16" viewBox="0 0 16 16" className="pixelated-icon">
      <rect x="2" y="6" width="12" height="8" fill="#FFB6C1"/>
      <rect x="2" y="6" width="12" height="1" fill="#000"/>
      <rect x="2" y="13" width="12" height="1" fill="#000"/>
      <rect x="2" y="6" width="1" height="8" fill="#000"/>
      <rect x="13" y="6" width="1" height="8" fill="#000"/>
      <rect x="4" y="8" width="8" height="1" fill="#FF69B4"/>
      <rect x="4" y="10" width="8" height="1" fill="#FF69B4"/>
      <rect x="4" y="12" width="8" height="1" fill="#FF69B4"/>
      <rect x="0" y="10" width="4" height="4" fill="#C0C0C0"/>
      <rect x="0" y="10" width="4" height="1" fill="#000"/>
      <rect x="0" y="13" width="4" height="1" fill="#000"/>
      <rect x="0" y="10" width="1" height="4" fill="#000"/>
      <rect x="3" y="10" width="1" height="4" fill="#000"/>
    </svg>
  ),
  fill: (
    <svg width="16" height="16" viewBox="0 0 16 16" className="pixelated-icon">
      <rect x="7" y="0" width="2" height="1" fill="#000"/>
      <rect x="6" y="1" width="4" height="1" fill="#000"/>
      <rect x="5" y="2" width="6" height="1" fill="#000"/>
      <rect x="4" y="3" width="8" height="1" fill="#000"/>
      <rect x="3" y="4" width="10" height="1" fill="#000"/>
      <rect x="2" y="5" width="12" height="1" fill="#000"/>
      <rect x="1" y="6" width="14" height="1" fill="#000"/>
      <rect x="0" y="7" width="16" height="1" fill="#000"/>
      <rect x="1" y="8" width="14" height="1" fill="#FFFF00"/>
      <rect x="2" y="9" width="12" height="1" fill="#FFFF00"/>
      <rect x="3" y="10" width="10" height="1" fill="#FFFF00"/>
      <rect x="4" y="11" width="8" height="1" fill="#FFFF00"/>
      <rect x="5" y="12" width="6" height="1" fill="#FFFF00"/>
      <rect x="6" y="13" width="4" height="1" fill="#FFFF00"/>
      <rect x="7" y="14" width="2" height="1" fill="#FFFF00"/>
      <rect x="7" y="15" width="2" height="1" fill="#FFFF00"/>
    </svg>
  ),
  line: (
    <svg width="16" height="16" viewBox="0 0 16 16" className="pixelated-icon">
      <rect x="0" y="15" width="1" height="1" fill="#000"/>
      <rect x="1" y="14" width="1" height="1" fill="#000"/>
      <rect x="2" y="13" width="1" height="1" fill="#000"/>
      <rect x="3" y="12" width="1" height="1" fill="#000"/>
      <rect x="4" y="11" width="1" height="1" fill="#000"/>
      <rect x="5" y="10" width="1" height="1" fill="#000"/>
      <rect x="6" y="9" width="1" height="1" fill="#000"/>
      <rect x="7" y="8" width="1" height="1" fill="#000"/>
      <rect x="8" y="7" width="1" height="1" fill="#000"/>
      <rect x="9" y="6" width="1" height="1" fill="#000"/>
      <rect x="10" y="5" width="1" height="1" fill="#000"/>
      <rect x="11" y="4" width="1" height="1" fill="#000"/>
      <rect x="12" y="3" width="1" height="1" fill="#000"/>
      <rect x="13" y="2" width="1" height="1" fill="#000"/>
      <rect x="14" y="1" width="1" height="1" fill="#000"/>
      <rect x="15" y="0" width="1" height="1" fill="#000"/>
    </svg>
  ),
  text: (
    <svg width="16" height="16" viewBox="0 0 16 16" className="pixelated-icon">
      <rect x="0" y="0" width="16" height="2" fill="#000"/>
      <rect x="7" y="2" width="2" height="12" fill="#000"/>
      <rect x="5" y="14" width="6" height="2" fill="#000"/>
      <rect x="6" y="3" width="1" height="1" fill="#000"/>
      <rect x="9" y="3" width="1" height="1" fill="#000"/>
      <rect x="6" y="4" width="1" height="1" fill="#000"/>
      <rect x="9" y="4" width="1" height="1" fill="#000"/>
    </svg>
  ),
};

const TOOL_TYPES: Array<{ type: DrawingTool['type']; label: string }> = [
  { type: 'pencil', label: 'Pencil' },
  { type: 'brush', label: 'Brush' },
  { type: 'eraser', label: 'Eraser' },
  { type: 'fill', label: 'Fill Bucket' },
  { type: 'line', label: 'Line' },
  { type: 'text', label: 'Text' },
];

export const ToolPalette: React.FC<ToolPaletteProps> = ({
  activeTool,
  onToolSelect,
  className = '',
}) => {
  return (
    <div className={`tool-palette ${className}`}>
      {TOOL_TYPES.map(({ type, label }) => (
        <button
          key={type}
          className={`tool-button retro-button ${activeTool.type === type ? 'active' : ''}`}
          onClick={() => onToolSelect(type)}
          title={label}
          aria-label={label}
        >
          {ToolIcons[type]}
        </button>
      ))}
    </div>
  );
};

export default ToolPalette;