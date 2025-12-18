import React, { useState, useRef, useEffect } from 'react';
import '../styles/retro.css';

interface MenuItem {
  label: string;
  action: string;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
}

interface MenuSystemProps {
  onMenuAction: (action: string) => void;
  hasGeneratedImage?: boolean;
  className?: string;
}

const FILE_MENU_ITEMS: MenuItem[] = [
  { label: 'New', action: 'new', shortcut: 'Ctrl+N' },
  { label: 'Open...', action: 'open', shortcut: 'Ctrl+O', disabled: true },
  { separator: true, label: '', action: '' },
  { label: 'Save as PNG...', action: 'save', shortcut: 'Ctrl+S' },
  { separator: true, label: '', action: '' },
  { label: 'Exit', action: 'exit', shortcut: 'Alt+F4', disabled: true },
];

const EDIT_MENU_ITEMS: MenuItem[] = [
  { label: 'Undo', action: 'undo', shortcut: 'Ctrl+Z', disabled: true },
  { label: 'Redo', action: 'redo', shortcut: 'Ctrl+Y', disabled: true },
  { separator: true, label: '', action: '' },
  { label: 'Cut', action: 'cut', shortcut: 'Ctrl+X', disabled: true },
  { label: 'Copy', action: 'copy', shortcut: 'Ctrl+C', disabled: true },
  { label: 'Paste', action: 'paste', shortcut: 'Ctrl+V', disabled: true },
  { separator: true, label: '', action: '' },
  { label: 'Select All', action: 'select-all', shortcut: 'Ctrl+A', disabled: true },
  { label: 'Clear Selection', action: 'clear-selection', disabled: true },
];

const AI_MENU_ITEMS: MenuItem[] = [
  { label: 'AI Magic...', action: 'ai-generate', shortcut: 'Ctrl+G' },
  { separator: true, label: '', action: '' },
  { label: 'Style Presets...', action: 'style-presets', disabled: true },
];

export const MenuSystem: React.FC<MenuSystemProps> = ({
  onMenuAction,
  hasGeneratedImage = false,
  className = '',
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const handleMenuItemClick = (action: string) => {
    setActiveMenu(null);
    onMenuAction(action);
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    if (item.separator) {
      return (
        <div key={index} className="menu-separator" style={{
          height: '1px',
          backgroundColor: '#808080',
          margin: '2px 0',
        }} />
      );
    }

    // Disable save if no generated image
    const isDisabled = item.disabled || (item.action === 'save' && !hasGeneratedImage);

    return (
      <div
        key={index}
        className={`menu-dropdown-item ${isDisabled ? 'disabled' : ''}`}
        onClick={() => !isDisabled && handleMenuItemClick(item.action)}
        style={{
          padding: '4px 16px',
          cursor: isDisabled ? 'default' : 'pointer',
          color: isDisabled ? '#808080' : '#000000',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            (e.target as HTMLElement).style.backgroundColor = '#316ac5';
            (e.target as HTMLElement).style.color = '#ffffff';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            (e.target as HTMLElement).style.backgroundColor = 'transparent';
            (e.target as HTMLElement).style.color = '#000000';
          }
        }}
      >
        <span>{item.label}</span>
        {item.shortcut && (
          <span style={{ marginLeft: '16px', fontSize: '10px' }}>
            {item.shortcut}
          </span>
        )}
      </div>
    );
  };

  const renderDropdown = (items: MenuItem[], menuName: string) => {
    if (activeMenu !== menuName) return null;

    return (
      <div
        className="menu-dropdown"
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          backgroundColor: '#c0c0c0',
          border: '2px outset #c0c0c0',
          minWidth: '150px',
          zIndex: 1000,
          boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        }}
      >
        {items.map((item, index) => renderMenuItem(item, index))}
      </div>
    );
  };

  return (
    <div ref={menuRef} className={`menu-bar ${className}`}>
      <div
        className={`menu-item ${activeMenu === 'file' ? 'active' : ''}`}
        onClick={() => handleMenuClick('file')}
        style={{ position: 'relative' }}
      >
        File
        {renderDropdown(FILE_MENU_ITEMS, 'file')}
      </div>

      <div
        className={`menu-item ${activeMenu === 'edit' ? 'active' : ''}`}
        onClick={() => handleMenuClick('edit')}
        style={{ position: 'relative' }}
      >
        Edit
        {renderDropdown(EDIT_MENU_ITEMS, 'edit')}
      </div>

      <div
        className={`menu-item ${activeMenu === 'ai' ? 'active' : ''}`}
        onClick={() => handleMenuClick('ai')}
        style={{ position: 'relative' }}
      >
        AI Magic
        {renderDropdown(AI_MENU_ITEMS, 'ai')}
      </div>
    </div>
  );
};

export default MenuSystem;