# Google Gemini Nano Integration Guide

## Overview

Your Retro AI Paint application now supports Google Gemini Nano for AI-powered image generation! Gemini Nano offers:

- **Cost-effective**: Very low cost per generation (~$0.002)
- **Fast processing**: Quick response times
- **High quality**: Advanced multimodal capabilities
- **Reliable**: Google's robust infrastructure

## Setup Instructions

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure Your Backend

Add these environment variables to your `backend/.env` file:

```bash
# Google Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-pro-vision
DEFAULT_AI_PROVIDER=gemini
```

### 3. Install Dependencies

Run this command in your backend directory:

```bash
npm install @google/generative-ai
```

### 4. Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start your frontend:
   ```bash
   npm run dev
   ```

3. Open the app and try generating an image with a sketch!

## Features

### Supported Capabilities
- ✅ Image-to-image generation (sketch enhancement)
- ✅ Text prompts with style presets
- ✅ Color hint integration
- ✅ High-resolution output (up to 1024x1024)
- ✅ Multiple format support (PNG, JPG, WebP)

### Pricing
- **Cost**: ~$0.002 per generation
- **Rate limits**: 60 requests/minute, 1500/hour
- **Concurrent requests**: Up to 15

## Usage Tips

### Best Prompts for Gemini
- Be descriptive: "Transform this sketch into a detailed watercolor painting of a sunset over mountains"
- Include style keywords: "photorealistic", "artistic", "cartoon", "vintage"
- Mention lighting: "soft lighting", "dramatic shadows", "bright daylight"

### Example Prompts
```
"Convert this sketch into a photorealistic portrait with soft studio lighting"
"Transform this drawing into a vibrant cartoon character with bold colors"
"Make this sketch look like a vintage oil painting with warm tones"
```

## Troubleshooting

### Common Issues

**API Key Error**
- Verify your API key is correct
- Check that billing is enabled in Google Cloud Console

**Generation Fails**
- Ensure your sketch has clear, recognizable shapes
- Try simpler prompts first
- Check the console for detailed error messages

**Slow Performance**
- Gemini is usually fast, but complex requests may take longer
- Consider reducing image resolution for faster results

### Getting Help

1. Check the browser console for error messages
2. Look at the backend logs for detailed information
3. Verify your API key has proper permissions

## Advanced Configuration

### Custom Models
You can experiment with different Gemini models by changing the `GEMINI_MODEL` environment variable:

```bash
GEMINI_MODEL=gemini-pro-vision  # Default, best for image tasks
GEMINI_MODEL=gemini-pro         # Text-only, faster but no image input
```

### Provider Selection
The app automatically selects the best provider based on:
- Cost requirements
- Feature support (img2img capability)
- Current availability

You can force Gemini usage by setting:
```bash
DEFAULT_AI_PROVIDER=gemini
```

## Next Steps

- Experiment with different prompts and styles
- Try combining multiple AI providers for different use cases
- Explore the caching system to reduce costs for similar requests

Happy painting with AI! 🎨✨