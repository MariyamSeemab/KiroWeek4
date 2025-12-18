import React, { useState, useEffect } from 'react';
import '../styles/retro.css';

interface ProgressDialogProps {
  isOpen: boolean;
  progress: number;
  message: string;
  onCancel?: () => void;
  canCancel?: boolean;
  className?: string;
}

export const ProgressDialog: React.FC<ProgressDialogProps> = ({
  isOpen,
  progress,
  message,
  onCancel,
  canCancel = true,
  className = '',
}) => {
  const [dots, setDots] = useState('');
  const [hourglassFrame, setHourglassFrame] = useState(0);

  // Animate dots for loading text
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Animate hourglass icon
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setHourglassFrame(prev => (prev + 1) % 4);
    }, 250);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Handle escape key for cancellation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && canCancel && onCancel) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canCancel, onCancel]);

  if (!isOpen) return null;

  const hourglassFrames = ['⧗', '⧖', '⧗', '⧕'];

  return (
    <div className="dialog-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div className={`retro-dialog ${className}`} style={{
        width: '350px',
        maxWidth: '90vw',
      }}>
        {/* Title Bar */}
        <div className="dialog-title-bar">
          <span>Please Wait...</span>
          {canCancel && onCancel && (
            <button
              className="dialog-close-button"
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '0 4px',
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Dialog Content */}
        <div className="dialog-content" style={{ textAlign: 'center', padding: '16px' }}>
          {/* Animated Hourglass */}
          <div style={{ 
            fontSize: '32px', 
            marginBottom: '16px',
            fontFamily: 'monospace',
            lineHeight: 1,
          }}>
            {hourglassFrames[hourglassFrame]}
          </div>

          {/* Progress Message */}
          <div style={{ 
            marginBottom: '16px',
            fontSize: '11px',
            fontFamily: 'MS Sans Serif, sans-serif',
            minHeight: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {message}{dots}
          </div>

          {/* Progress Bar */}
          <div className="retro-progress" style={{ marginBottom: '16px' }}>
            <div 
              className="retro-progress-bar"
              style={{ 
                width: `${Math.max(0, Math.min(100, progress))}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {/* Progress Percentage */}
          <div style={{ 
            fontSize: '10px',
            color: '#666',
            marginBottom: '16px',
            fontFamily: 'MS Sans Serif, sans-serif',
          }}>
            {Math.round(progress)}% Complete
          </div>

          {/* MS-DOS Style Progress Indicator */}
          <div style={{
            fontFamily: 'Courier New, monospace',
            fontSize: '10px',
            backgroundColor: '#000',
            color: '#00ff00',
            padding: '8px',
            border: '2px inset #c0c0c0',
            marginBottom: '16px',
            textAlign: 'left',
            minHeight: '60px',
          }}>
            <div>C:\RETRO-AI-PAINT&gt; GENERATE.EXE</div>
            <div>Initializing AI model...</div>
            <div>Processing sketch data...</div>
            <div>Applying style transformations...</div>
            <div style={{ color: progress > 50 ? '#00ff00' : '#666' }}>
              Rendering final image...
            </div>
            <div style={{ 
              marginTop: '4px',
              color: progress === 100 ? '#00ff00' : '#ffff00'
            }}>
              {progress === 100 ? 'COMPLETE' : 'WORKING...'}
            </div>
          </div>

          {/* Cancel Button */}
          {canCancel && onCancel && (
            <button
              className="retro-button"
              onClick={onCancel}
              style={{ minWidth: '80px' }}
            >
              Cancel
            </button>
          )}

          {/* Completion Message */}
          {progress === 100 && (
            <div style={{
              marginTop: '8px',
              fontSize: '10px',
              color: '#008000',
              fontWeight: 'bold',
            }}>
              Generation complete! Preparing your artwork...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressDialog;