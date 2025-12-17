# Design Document: Real AI Integration for Retro AI Paint

## Overview

This design document outlines the architecture and implementation strategy for upgrading the Retro AI Paint application from mock AI functionality to real AI-powered image generation. The system will integrate with multiple AI providers (Stable Diffusion, DALL-E, Replicate) while maintaining the retro aesthetic and ensuring reliable, cost-effective operation.

The upgrade focuses on three core areas: AI provider integration, intelligent image preprocessing, and robust error handling with caching. The design prioritizes user experience consistency while adding powerful real AI capabilities behind the familiar retro interface.

## Architecture

The enhanced system extends the existing client-server architecture with new AI integration layers:

```
┌─────────────────────────────────────┐
│           Frontend (Web)            │
│  ┌─────────────────────────────────┐│
│  │     Enhanced AI Dialog          ││
│  │  - Provider Selection           ││
│  │  - Advanced Options             ││
│  │  - Cost Estimation              ││
│  └─────────────────────────────────┘│
│  │     Existing Retro UI           │
└─────────────────────────────────────┘
                    │
                    │ HTTP/WebSocket
                    ▼
┌─────────────────────────────────────┐
│        Enhanced Backend API         │
│  ┌─────────────────────────────────┐│
│  │      AI Provider Manager        ││
│  │  - Multi-provider Support       ││
│  │  - Failover Logic               ││
│  │  - Rate Limit Management        ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │    Image Processing Pipeline    ││
│  │  - Sketch Preprocessing         ││
│  │  - Format Conversion            ││
│  │  - Quality Enhancement          ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │      Caching & Queue System     ││
│  │  - Redis Cache                  ││
│  │  - Request Queue                ││
│  │  - Result Storage               ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
                    │
                    │ HTTPS APIs
                    ▼
┌─────────────────────────────────────┐
│        External AI Providers        │
│  ┌─────────────┬─────────────────┐  │
│  │ Stable      │ DALL-E 3        │  │
│  │ Diffusion   │ OpenAI API      │  │
│  │ via         │                 │  │
│  │ Replicate   │                 │  │
│  └─────────────┴─────────────────┘  │
│  ┌─────────────┬─────────────────┐  │
│  │ Midjourney  │ Custom Models   │  │
│  │ API         │ Hugging Face    │  │
│  └─────────────┴─────────────────┘  │
└─────────────────────────────────────┘
```

## Components and Interfaces

### New Backend Components

**AIProviderManager**
- Manages connections to multiple AI services (Stable Diffusion, DALL-E, Midjourney)
- Implements failover logic and load balancing across providers
- Handles authentication and API key management securely
- Monitors usage quotas and implements cost controls

**ImagePreprocessingPipeline**
- Analyzes canvas sketches for composition, colors, and detail level
- Converts canvas ImageData to AI-compatible formats (PNG, JPEG)
- Enhances sketch quality through contrast adjustment and edge detection
- Extracts color palettes and composition guides for AI conditioning

**GenerationQueueManager**
- Manages concurrent generation requests and rate limiting
- Implements priority queuing for different user tiers
- Handles request batching and optimization
- Provides real-time status updates via WebSocket

**ResultCacheService**
- Implements Redis-based caching for generated images
- Uses content-based hashing for cache key generation
- Manages cache expiration and storage optimization
- Provides cache hit analytics and cost savings metrics

### Enhanced Frontend Components

**EnhancedAIDialog**
- Extends existing AI dialog with provider selection dropdown
- Adds advanced options panel (strength, steps, guidance, seed)
- Displays cost estimates and generation time predictions
- Provides real-time generation progress with provider-specific details

**ProviderStatusIndicator**
- Shows current status of each AI provider (online, busy, offline)
- Displays estimated wait times and queue positions
- Provides provider-specific capability information
- Alerts users to service disruptions or maintenance

## Data Models

### AI Provider Configuration
```typescript
interface AIProvider {
  id: string;
  name: string;
  type: 'stable-diffusion' | 'dalle' | 'midjourney' | 'custom';
  endpoint: string;
  apiKey: string; // Encrypted in storage
  capabilities: {
    maxResolution: { width: number; height: number };
    supportedFormats: string[];
    maxPromptLength: number;
    supportsImg2Img: boolean;
    supportsInpainting: boolean;
  };
  pricing: {
    costPerGeneration: number;
    currency: string;
    freeQuota?: number;
  };
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    concurrentRequests: number;
  };
  status: 'online' | 'offline' | 'maintenance' | 'rate-limited';
}
```

### Enhanced Generation Request
```typescript
interface EnhancedGenerationRequest {
  id: string;
  userId?: string;
  sketchData: {
    imageData: ImageData;
    preprocessed: Buffer; // Optimized for AI
    colorPalette: string[];
    compositionAnalysis: CompositionData;
  };
  prompt: string;
  negativePrompt?: string;
  provider: string;
  parameters: {
    strength: number; // 0.0 - 1.0
    steps: number; // 20-150
    guidance: number; // 1-30
    seed?: number;
    width: number;
    height: number;
  };
  stylePreset?: string;
  priority: 'low' | 'normal' | 'high';
  maxCost: number;
  createdAt: Date;
  estimatedCompletionTime: Date;
}
```

### Generation Result with Metadata
```typescript
interface EnhancedGenerationResult {
  id: string;
  requestId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  generatedImage?: {
    data: Buffer;
    format: string;
    width: number;
    height: number;
    url?: string; // For cached results
  };
  metadata: {
    provider: string;
    model: string;
    actualParameters: object;
    processingTime: number;
    cost: number;
    cacheHit: boolean;
    quality: number; // 0-100
  };
  error?: {
    code: string;
    message: string;
    retryable: boolean;
    suggestedFix?: string;
  };
  createdAt: Date;
  completedAt?: Date;
}
```

### Cache Entry
```typescript
interface CacheEntry {
  key: string; // Hash of sketch + prompt + parameters
  imageData: Buffer;
  metadata: {
    originalRequest: EnhancedGenerationRequest;
    provider: string;
    quality: number;
    hitCount: number;
    lastAccessed: Date;
    expiresAt: Date;
  };
  tags: string[]; // For cache invalidation
}
```

Now I need to complete the prework analysis before writing the Correctness Properties section.

<function_calls>
<invoke name="prework">
<parameter name="featureName">real-ai-integration

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After completing the prework analysis, I've identified several redundant properties that can be consolidated:
- Properties 1.1, 1.2, and 1.3 all test the end-to-end AI generation workflow and can be combined
- Properties 2.1, 2.2, and 2.4 all test error handling and can be unified into a comprehensive error handling property
- Properties 3.1, 3.2, and 3.5 all test caching functionality and can be consolidated
- Properties 4.2, 4.3, and 4.4 all test provider management and can be combined
- Properties 5.1, 5.2, 5.3, and 5.5 all test preprocessing functionality and can be unified
- Properties 6.1, 6.2, 6.3, and 6.4 all test system administration features and can be consolidated
- Properties 7.2, 7.3, and 7.5 all test parameter handling and persistence and can be combined

**Property 1: Real AI generation workflow**
*For any* valid sketch and prompt combination, the system should route requests to actual AI providers, receive generated images, and update the canvas with real AI-generated artwork
**Validates: Requirements 1.1, 1.2, 1.3**

**Property 2: Concurrent request handling**
*For any* set of simultaneous generation requests, the system should properly queue and process them without conflicts or data corruption
**Validates: Requirements 1.5**

**Property 3: Comprehensive error handling**
*For any* API failure, rate limit, or network issue, the system should provide appropriate error messages, implement retry logic, and preserve user work
**Validates: Requirements 2.1, 2.2, 2.4**

**Property 4: Cache performance and optimization**
*For any* generation request, the system should check cache for similar results, return cached results within performance requirements, and properly store new results with correct expiration
**Validates: Requirements 3.1, 3.2, 3.5**

**Property 5: Request batching and optimization**
*For any* set of similar requests, the system should batch them appropriately and optimize image data to minimize API costs
**Validates: Requirements 3.3, 3.4**

**Property 6: Provider management and failover**
*For any* provider selection or failure scenario, the system should configure appropriate parameters, handle capability differences, and implement automatic failover with cost estimation
**Validates: Requirements 4.2, 4.3, 4.4, 4.5**

**Property 7: Intelligent sketch preprocessing**
*For any* input sketch, the preprocessing pipeline should enhance quality, extract color palettes, maintain aspect ratios, and handle text based on user preferences
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

**Property 8: System administration and security**
*For any* configuration change or usage monitoring scenario, the system should securely manage credentials, implement usage controls, log appropriate metrics, and apply changes without service interruption
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

**Property 9: Advanced parameter handling**
*For any* user-specified generation parameters, the system should validate ranges, ensure reproducibility with seeds, and persist settings across sessions
**Validates: Requirements 7.2, 7.3, 7.5**

## Error Handling

The real AI integration introduces new error scenarios that require comprehensive handling:

**AI Provider Errors**
- API authentication failures trigger secure credential refresh
- Rate limit exceeded errors implement exponential backoff and queue management
- Content policy violations provide specific feedback and prompt suggestions
- Model unavailability triggers automatic provider failover
- Generation timeout errors preserve original sketch and offer retry options

**Network and Connectivity Errors**
- Connection failures implement retry logic with circuit breaker pattern
- Slow network conditions trigger request timeout and user notification
- Intermittent connectivity uses request queuing and background retry
- DNS resolution failures attempt alternative provider endpoints

**Resource and Cost Management Errors**
- Budget exceeded errors halt new requests and notify administrators
- Storage quota exceeded triggers cache cleanup and user notification
- Memory limitations during preprocessing trigger optimization and warnings
- Concurrent request limits implement fair queuing and user feedback

**Data Processing Errors**
- Invalid sketch data triggers validation and user-friendly error messages
- Image format conversion failures attempt alternative formats
- Preprocessing pipeline errors preserve original sketch and log details
- Cache corruption triggers automatic cleanup and regeneration

## Testing Strategy

The testing approach combines unit testing for specific functionality with property-based testing for universal behaviors across the AI integration:

**Unit Testing Approach**
- Test individual AI provider integrations with mock responses
- Verify error handling for specific failure scenarios
- Validate image preprocessing pipeline with known inputs
- Test cache operations with controlled data sets
- Framework: Jest with custom AI provider mocks

**Property-Based Testing Approach**
- Verify universal properties hold across all AI providers and configurations using fast-check library
- Generate random sketches, prompts, and provider configurations
- Test error handling with simulated failures and network conditions
- Validate caching behavior across different request patterns
- Each property-based test runs minimum 100 iterations for thorough coverage
- Framework: fast-check for JavaScript property-based testing

**Property Test Implementation Requirements**
- Each correctness property must be implemented by a single property-based test
- Tests must be tagged with format: '**Feature: real-ai-integration, Property {number}: {property_text}**'
- Property tests should focus on core logic with minimal mocking of AI providers
- Generators should intelligently constrain inputs to valid provider capabilities and parameters

**Integration Testing**
- End-to-end workflows with real AI provider sandbox environments
- Load testing for concurrent request handling and queue management
- Cost optimization testing with actual API usage monitoring
- Failover testing with simulated provider outages

## Implementation Technologies

**AI Provider Integration**
- Replicate API for Stable Diffusion models with Node.js SDK
- OpenAI API for DALL-E 3 integration with official client library
- Hugging Face Inference API for custom model support
- Custom HTTP clients for additional providers with retry logic

**Image Processing**
- Sharp library for high-performance image processing and format conversion
- Canvas API for client-side sketch analysis and preprocessing
- ImageMagick integration for advanced image enhancement operations
- WebP and AVIF support for optimized image storage and transmission

**Caching and Queue Management**
- Redis for high-performance caching with automatic expiration
- Bull Queue for robust job processing with retry and failure handling
- MongoDB for persistent storage of generation history and user preferences
- WebSocket connections for real-time progress updates and notifications

**Security and Configuration**
- Vault or AWS Secrets Manager for secure API key storage
- Environment-based configuration with validation
- Rate limiting with Redis-based counters
- Request signing and validation for API security

## Performance Considerations

**AI Provider Optimization**
- Request batching where supported by provider APIs
- Intelligent provider selection based on current load and capabilities
- Connection pooling and keep-alive for reduced latency
- Parallel processing for multiple concurrent generations

**Image Processing Optimization**
- Lazy loading of preprocessing modules to reduce memory usage
- Streaming image processing for large sketches
- WebWorkers for CPU-intensive preprocessing operations
- Progressive image enhancement based on sketch complexity

**Caching Strategy**
- Content-based hashing for efficient cache key generation
- Tiered caching with memory and disk storage
- Cache warming for popular style presets and common prompts
- Intelligent cache eviction based on usage patterns and cost metrics

**Cost Optimization**
- Dynamic provider selection based on current pricing and availability
- Request deduplication to avoid unnecessary API calls
- Intelligent parameter optimization to balance quality and cost
- Usage analytics and budget alerts for cost control

## Security Considerations

**API Key Management**
- Encrypted storage of all provider API keys
- Key rotation policies and automated renewal where supported
- Separate keys for development, staging, and production environments
- Audit logging for all key access and usage

**Data Privacy and Protection**
- No persistent storage of user sketches beyond cache expiration
- Encrypted transmission of all image data to AI providers
- GDPR compliance for European users with data deletion capabilities
- Clear privacy policies regarding AI provider data sharing

**Request Validation and Sanitization**
- Input validation for all user prompts and parameters
- Content filtering to prevent policy violations
- Rate limiting per user and IP address
- Request signing to prevent tampering and replay attacks

**System Security**
- Regular security updates for all dependencies
- Network segmentation between public API and AI provider connections
- Monitoring and alerting for suspicious usage patterns
- Backup and disaster recovery procedures for critical data