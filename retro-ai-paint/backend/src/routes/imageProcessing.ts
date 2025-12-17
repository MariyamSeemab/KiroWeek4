import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { APIResponse } from '../types';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * POST /api/image/analyze
 * Analyze uploaded sketch for color palette and composition
 */
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image file is required'
      } as APIResponse);
    }

    // Process image with Sharp
    const image = sharp(req.file.buffer);
    const metadata = await image.metadata();
    
    // Extract dominant colors (simplified implementation)
    const { data, info } = await image
      .resize(100, 100) // Resize for faster processing
      .raw()
      .toBuffer({ resolveWithObject: true });

    const dominantColors = extractDominantColors(data, info.channels);
    
    // Analyze composition (basic implementation)
    const composition = analyzeComposition(data, info.width, info.height, info.channels);

    res.json({
      success: true,
      data: {
        dimensions: {
          width: metadata.width,
          height: metadata.height,
        },
        dominantColors,
        composition,
        fileSize: req.file.size,
        format: metadata.format,
      }
    } as APIResponse);

  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze image'
    } as APIResponse);
  }
});

/**
 * POST /api/image/convert
 * Convert image format or resize
 */
router.post('/convert', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image file is required'
      } as APIResponse);
    }

    const { format = 'png', width, height, quality = 90 } = req.body;
    
    let pipeline = sharp(req.file.buffer);
    
    // Resize if dimensions provided
    if (width || height) {
      pipeline = pipeline.resize(
        width ? parseInt(width) : undefined,
        height ? parseInt(height) : undefined,
        { fit: 'inside', withoutEnlargement: true }
      );
    }

    // Convert format
    let outputBuffer: Buffer;
    let contentType: string;

    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        outputBuffer = await pipeline.jpeg({ quality: parseInt(quality) }).toBuffer();
        contentType = 'image/jpeg';
        break;
      case 'webp':
        outputBuffer = await pipeline.webp({ quality: parseInt(quality) }).toBuffer();
        contentType = 'image/webp';
        break;
      case 'png':
      default:
        outputBuffer = await pipeline.png().toBuffer();
        contentType = 'image/png';
        break;
    }

    res.set({
      'Content-Type': contentType,
      'Content-Length': outputBuffer.length.toString(),
    });

    res.send(outputBuffer);

  } catch (error) {
    console.error('Image conversion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert image'
    } as APIResponse);
  }
});

/**
 * POST /api/image/optimize
 * Optimize image for AI processing
 */
router.post('/optimize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image file is required'
      } as APIResponse);
    }

    // Optimize for AI processing: resize to 512x512, enhance contrast
    const optimizedBuffer = await sharp(req.file.buffer)
      .resize(512, 512, { 
        fit: 'cover',
        position: 'center'
      })
      .normalize() // Enhance contrast
      .png()
      .toBuffer();

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': optimizedBuffer.length.toString(),
    });

    res.send(optimizedBuffer);

  } catch (error) {
    console.error('Image optimization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize image'
    } as APIResponse);
  }
});

// Helper function to extract dominant colors
function extractDominantColors(data: Buffer, channels: number): string[] {
  const colorCounts = new Map<string, number>();
  const step = channels * 4; // Sample every 4th pixel for performance
  
  for (let i = 0; i < data.length; i += step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Skip very dark or very light pixels
    const brightness = (r + g + b) / 3;
    if (brightness < 20 || brightness > 235) continue;
    
    // Quantize colors to reduce noise
    const quantizedR = Math.round(r / 32) * 32;
    const quantizedG = Math.round(g / 32) * 32;
    const quantizedB = Math.round(b / 32) * 32;
    
    const hex = `#${quantizedR.toString(16).padStart(2, '0')}${quantizedG.toString(16).padStart(2, '0')}${quantizedB.toString(16).padStart(2, '0')}`;
    colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
  }
  
  // Return top 8 colors
  return Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([color]) => color);
}

// Helper function to analyze composition
function analyzeComposition(data: Buffer, width: number, height: number, channels: number) {
  // Simple composition analysis
  let nonWhitePixels = 0;
  let totalPixels = 0;
  
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    totalPixels++;
    
    // Consider non-white pixels as content
    if (r < 240 || g < 240 || b < 240) {
      nonWhitePixels++;
    }
  }
  
  const contentRatio = nonWhitePixels / totalPixels;
  
  let complexity: 'simple' | 'moderate' | 'complex';
  if (contentRatio < 0.1) {
    complexity = 'simple';
  } else if (contentRatio < 0.3) {
    complexity = 'moderate';
  } else {
    complexity = 'complex';
  }
  
  return {
    contentRatio,
    complexity,
    estimatedElements: Math.ceil(contentRatio * 10), // Rough estimate
  };
}

export { router as imageProcessingRouter };