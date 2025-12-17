import React, { useState, useEffect } from 'react';
import { StylePreset } from '../types';
import '../styles/retro.css';

interface AIDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, stylePreset?: StylePreset) => void;
  isGenerating?: boolean;
  className?: string;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    promptModifier: 'photorealistic, highly detailed, professional photography',
    technicalParams: {
      strength: 0.8,
      guidance: 7.5,
      negativePrompt: 'cartoon, anime, painting, drawing, sketch',
    },
  },
  {
    id: 'oil-painting',
    name: 'Oil Painting',
    promptModifier: 'oil painting, classical art style, brush strokes, artistic',
    technicalParams: {
      strength: 0.7,
      guidance: 8.0,
      negativePrompt: 'photograph, digital art, 3d render',
    },
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    promptModifier: 'cyberpunk style, neon lights, futuristic, sci-fi, digital art',
    technicalParams: {
      strength: 0.75,
      guidance: 8.5,
      negativePrompt: 'medieval, historical, natural, organic',
    },
  },
  {
    id: '8bit-art',
    name: '8-bit Art',
    promptModifier: 'pixel art, 8-bit style, retro gaming, pixelated',
    technicalParams: {
      strength: 0.6,
      guidance: 9.0,
      negativePrompt: 'realistic, photographic, smooth, high resolution',
    },
  },
];

export const AIDialog: React.FC<AIDialogProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating = false,
  className = '',
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<StylePreset | undefined>(undefined);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setSelectedPreset(undefined);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isGenerating) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isGenerating, onClose]);

  const handleGenerate = () => {
    if (prompt.trim() && !isGenerating) {
      onGenerate(prompt.trim(), selectedPreset);
    }
  };

  const handleCancel = () => {
    if (!isGenerating) {
      onClose();
    }
  };

  if (!isOpen) return null;

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
        width: '400px',
        maxWidth: '90vw',
      }}>
        {/* Title Bar */}
        <div className="dialog-title-bar">
          <span>AI Image Synthesizer v1.0</span>
          {!isGenerating && (
            <button
              className="dialog-close-button"
              onClick={handleCancel}
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
        <div className="dialog-content">
          {/* AI Prompt Input */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px',
              fontWeight: 'bold',
            }}>
              AI Enhancement Prompt:
            </label>
            <textarea
              className="retro-textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how you want to transform your sketch..."
              rows={4}
              style={{ 
                width: '100%',
                boxSizing: 'border-box',
              }}
              disabled={isGenerating}
            />
          </div>

          {/* Style Presets */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: 'bold',
            }}>
              Style Preset (optional):
            </label>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="retro-radio">
                <input
                  type="radio"
                  name="stylePreset"
                  checked={selectedPreset === undefined}
                  onChange={() => setSelectedPreset(undefined)}
                  disabled={isGenerating}
                />
                None (use prompt only)
              </label>
              
              {STYLE_PRESETS.map((preset) => (
                <label key={preset.id} className="retro-radio">
                  <input
                    type="radio"
                    name="stylePreset"
                    checked={selectedPreset?.id === preset.id}
                    onChange={() => setSelectedPreset(preset)}
                    disabled={isGenerating}
                  />
                  {preset.name}
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '8px',
            marginTop: '16px',
          }}>
            <button
              className="retro-button"
              onClick={handleCancel}
              disabled={isGenerating}
              style={{ minWidth: '80px' }}
            >
              {isGenerating ? 'Generating...' : 'Cancel'}
            </button>
            <button
              className="retro-button"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              style={{ 
                minWidth: '80px',
                fontWeight: 'bold',
              }}
            >
              {isGenerating ? 'Please Wait...' : 'Generate'}
            </button>
          </div>

          {/* Generation Status */}
          {isGenerating && (
            <div style={{ 
              marginTop: '12px',
              textAlign: 'center',
              fontSize: '10px',
              color: '#666',
            }}>
              <div>Processing your sketch with AI...</div>
              <div style={{ marginTop: '4px' }}>
                This may take 30-60 seconds
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDialog;