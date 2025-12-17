# Design Document: Retro AI Paint

## Overview

The Retro AI Paint application is a web-based drawing tool that combines the nostalgic interface of 1990s MS Paint with modern AI image generation capabilities. The system consists of a frontend canvas application with retro styling and a backend AI service that transforms user sketches into high-quality artwork based on text prompts.

The application follows a two-phase user experience: Sketch Mode for creating simple drawings with classic tools, and Generation Mode where AI processes the sketch and prompt to produce enhanced artwork. The design emphasizes maintaining authentic retro aesthetics while delivering modern AI capabilities seamlessly.

## Architecture

The system uses a client-server architecture with clear separation between the retro UI layer and AI processing backend:

```
┌─────────────────────────────────────┐
│           Frontend (Web)            │
│  ┌─────────────────────────────────┐│
│  │        Retro UI Layer           ││
│  │  - Canvas Component             ││
│  │  - Tool Palette                 ││
│  │  - Menu System                  ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │      Drawing Engine             ││
│  │  - Pixel Manipulation          ││
│  │  - Tool Implementations         ││
│  │  - Canvas State Management      ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
                    │
                    │ HTTP/WebSocket
                    ▼
┌─────────────────────────────────────┐
│           Backend API               │
│  ┌─────────────────────────────────┐│
│  │      AI Generation Service      ││
│  │  - Image Processing             ││
│  │  - Prompt Engineering           ││
│  │  - Style Application            ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │      External AI Provider       ││
│  │  - Stable Diffusion API         ││
│  │  - Image-to-Image Pipeline      ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

**RetroCanvas**
- Manages the main drawing surface with pixel-perfect rendering
- Handles tool selection and drawing operations
- Maintains canvas state and undo/redo functionality
- Exports canvas data for AI processing

**ToolPalette**
- Renders classic MS Paint tool icons with chunky, pixelated styling
- Manages tool state (active tool, brush size, etc.)
- Provides tool-specific cursors and visual feedback

**ColorPalette**
- Displays the classic 16-color MS Paint palette
- Tracks primary/secondary color selection
- Provides color picker interface with retro styling

**AIDialog**
- Renders retro-styled modal dialog for AI generation
- Manages prompt input and style preset selection
- Handles generation progress and error states

**MenuSystem**
- Implements classic File/Edit menu structure
- Provides save/load functionality for generated images
- Manages application state transitions

### Backend Services

**ImageProcessingService**
- Converts canvas pixel data to AI-compatible formats
- Extracts color palette and composition information from sketches
- Prepares image conditioning data for AI generation

**AIGenerationService**
- Interfaces with external AI providers (Stable Diffusion, DALL-E, etc.)
- Combines sketch data with text prompts and style presets
- Manages generation queues and result caching

**PromptEngineeringService**
- Enhances user prompts with technical parameters
- Applies style preset modifications to base prompts
- Optimizes prompts for sketch-to-image generation

## Data Models

### Canvas State
```typescript
interface CanvasState {
  width: number;
  height: number;
  pixels: Uint8ClampedArray; // RGBA pixel data
  activeLayer: number;
  backgroundColor: string;
  zoomLevel: number;
}
```

### Drawing Tool
```typescript
interface DrawingTool {
  type: 'pencil' | 'brush' | 'eraser' | 'fill' | 'line' | 'text';
  size: number;
  color: string;
  opacity: number;
  isActive: boolean;
}
```

### AI Generation Request
```typescript
interface GenerationRequest {
  sketchData: ImageData;
  prompt: string;
  stylePreset?: StylePreset;
  colorHints: string[];
  compositionData: CompositionAnalysis;
  generationParams: {
    strength: number; // How much to modify the original
    steps: number;
    guidance: number;
  };
}
```

### Style Preset
```typescript
interface StylePreset {
  id: string;
  name: string;
  promptModifier: string;
  technicalParams: {
    strength: number;
    guidance: number;
    negativePrompt: string;
  };
}
```

### Generation Result
```typescript
interface GenerationResult {
  id: string;
  originalSketch: ImageData;
  generatedImage: Blob;
  prompt: string;
  stylePreset?: string;
  timestamp: Date;
  metadata: {
    processingTime: number;
    modelUsed: string;
    parameters: object;
  };
}
```

Now I need to complete the prework analysis before writing the Correctness Properties section.

<function_calls>
<invoke name="prework">
<parameter name="featureName">retro-ai-paint

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After reviewing the prework analysis, I've identified several redundant properties that can be consolidated:
- Properties 1.1, 1.3, and 1.4 all test tool functionality and can be combined into a comprehensive tool behavior property
- Properties 3.2, 3.3, and 3.5 all relate to AI generation processing and can be unified
- Properties 5.2, 5.3, 5.4, and 5.5 all test UI state during generation and can be consolidated
- Properties 6.2, 6.3, and 6.4 all test state management and can be combined

**Property 1: Tool selection and operation consistency**
*For any* drawing tool and canvas state, selecting a tool should activate it with proper visual feedback, and subsequent drawing operations should use the selected tool's behavior and currently selected color
**Validates: Requirements 1.1, 1.3, 1.4**

**Property 2: Pixelated rendering consistency**
*For any* drawing operation on the canvas, the rendered output should maintain pixelated, low-resolution styling consistent with 1990s paint programs
**Validates: Requirements 1.2**

**Property 3: AI generation data processing**
*For any* valid sketch and text prompt combination, the AI generation process should receive both the canvas data and prompt text, and either produce a valid generated image or preserve the original sketch on failure
**Validates: Requirements 3.2, 3.3, 3.5**

**Property 4: Style preset integration**
*For any* selected style preset and text prompt, the system should combine both inputs for AI generation, with unselected presets defaulting to prompt-only generation
**Validates: Requirements 4.2, 4.3**

**Property 5: Generation UI state management**
*For any* AI generation operation, the system should display progress indicators during processing, disable user interactions until completion, and properly restore UI state when finished or cancelled
**Validates: Requirements 5.2, 5.3, 5.4, 5.5**

**Property 6: Application state persistence**
*For any* save operation, canvas clearing, or session transition, the system should correctly preserve or restore appropriate state elements (saved files match generated content, new sketches clear canvas, user preferences persist)
**Validates: Requirements 6.2, 6.3, 6.4**

**Property 7: Color palette extraction**
*For any* sketch containing colored pixels, the AI processing system should correctly identify and extract the color palette used in the original drawing
**Validates: Requirements 7.1**

## Error Handling

The system implements comprehensive error handling across all major components:

**Canvas Operations**
- Invalid tool selections default to pencil tool
- Drawing operations outside canvas bounds are clipped
- Undo/redo operations handle empty history gracefully
- Canvas corruption triggers automatic recovery from last known good state

**AI Generation Errors**
- Network failures display user-friendly error messages with retry options
- Invalid prompts are sanitized or rejected with helpful feedback
- Generation timeouts allow user cancellation and preserve original sketch
- API rate limiting is handled with queue management and user notification

**File Operations**
- Save failures preserve user work and suggest alternative locations
- Corrupted image data triggers validation and error reporting
- Browser storage limitations are handled with cleanup and user notification

**UI State Management**
- Component rendering errors trigger graceful degradation
- Invalid user inputs are validated and corrected automatically
- Memory limitations trigger canvas optimization and user warnings

## Testing Strategy

The testing approach combines unit testing for specific functionality with property-based testing for universal behaviors:

**Unit Testing Approach**
- Test specific UI component rendering and interaction
- Verify error handling for known failure cases
- Validate integration between frontend and backend services
- Test specific examples of AI generation workflows
- Framework: Jest with React Testing Library for frontend components

**Property-Based Testing Approach**
- Verify universal properties hold across all valid inputs using fast-check library
- Generate random canvas states, tool selections, and user interactions
- Test AI generation with varied sketch and prompt combinations
- Validate state management across different application workflows
- Each property-based test runs minimum 100 iterations for thorough coverage
- Framework: fast-check for JavaScript property-based testing

**Property Test Implementation Requirements**
- Each correctness property must be implemented by a single property-based test
- Tests must be tagged with format: '**Feature: retro-ai-paint, Property {number}: {property_text}**'
- Property tests should focus on core logic without excessive mocking
- Generators should intelligently constrain inputs to valid application states

**Integration Testing**
- End-to-end workflows from sketch creation to AI generation
- Cross-browser compatibility for retro styling and canvas operations
- Performance testing for large canvas operations and AI generation
- Accessibility testing for keyboard navigation and screen readers

## Implementation Technologies

**Frontend Stack**
- React 18 with TypeScript for component architecture
- HTML5 Canvas API for pixel-perfect drawing operations
- CSS3 with custom properties for retro styling system
- Vite for development and build tooling

**Backend Stack**
- Node.js with Express for API server
- Sharp library for image processing and format conversion
- WebSocket support for real-time generation progress updates
- Redis for caching generation results and managing queues

**AI Integration**
- Stable Diffusion API via Replicate or Hugging Face
- Custom prompt engineering pipeline for sketch-to-image optimization
- Image preprocessing pipeline for canvas data conversion
- Fallback providers for reliability and cost optimization

**Development Tools**
- ESLint and Prettier for code quality
- Jest and React Testing Library for unit testing
- fast-check for property-based testing
- Cypress for end-to-end testing
- Docker for consistent development environments

## Performance Considerations

**Canvas Optimization**
- Efficient pixel manipulation using ImageData and typed arrays
- Lazy rendering for off-screen canvas operations
- Memory management for large canvas sizes and undo history
- Debounced drawing operations to prevent excessive redraws

**AI Generation Optimization**
- Request queuing and batching for multiple simultaneous users
- Result caching based on sketch hash and prompt similarity
- Progressive image loading for large generated images
- Timeout handling and graceful degradation for slow responses

**UI Responsiveness**
- Web Workers for intensive image processing operations
- Virtualized rendering for large tool palettes and color selections
- Optimized CSS animations for retro UI effects
- Lazy loading of non-critical UI components

## Security Considerations

**Input Validation**
- Sanitization of user prompts to prevent injection attacks
- Canvas data validation to prevent malicious image uploads
- File size limits for generated image downloads
- Rate limiting for AI generation requests

**Data Privacy**
- No persistent storage of user sketches or generated images
- Optional user consent for temporary caching of generation results
- Secure transmission of image data to AI providers
- Clear data retention policies for debugging and analytics

**API Security**
- Authentication tokens for AI provider access
- Request signing and validation for backend communications
- CORS configuration for secure cross-origin requests
- Input sanitization for all user-provided data