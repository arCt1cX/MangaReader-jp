import { createWorker } from 'tesseract.js';

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.worker = await createWorker('jpn', 1, {
        logger: m => console.log(m)
      });

      await this.worker.setParameters({
        tessedit_char_whitelist: 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンー一二三四五六七八九十百千万億兆京垓𥝱穣溝澗正載極恒河沙阿僧祇那由他不可思議無量大数ぁぃぅぇぉっゃゅょァィゥェォッャュョ',
        tessedit_pageseg_mode: '6'
      });

      this.isInitialized = true;
      console.log('OCR Service initialized');
    } catch (error) {
      console.error('Failed to initialize OCR:', error);
      throw error;
    }
  }

  async extractText(imageElement, boundingBox = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // If bounding box is provided, crop the image
      if (boundingBox) {
        canvas.width = boundingBox.width;
        canvas.height = boundingBox.height;
        ctx.drawImage(
          imageElement,
          boundingBox.x,
          boundingBox.y,
          boundingBox.width,
          boundingBox.height,
          0,
          0,
          boundingBox.width,
          boundingBox.height
        );
      } else {
        canvas.width = imageElement.naturalWidth;
        canvas.height = imageElement.naturalHeight;
        ctx.drawImage(imageElement, 0, 0);
      }

      const { data: { text, confidence } } = await this.worker.recognize(canvas);
      
      return {
        text: text.trim(),
        confidence,
        success: confidence > 60 // Consider successful if confidence > 60%
      };
    } catch (error) {
      console.error('OCR extraction failed:', error);
      return {
        text: '',
        confidence: 0,
        success: false,
        error: error.message
      };
    }
  }

  async extractTextFromRegions(imageElement, regions) {
    const results = [];
    
    for (const region of regions) {
      const result = await this.extractText(imageElement, region);
      results.push({
        ...result,
        region
      });
    }
    
    return results;
  }

  // Detect text regions in an image (simplified implementation)
  detectTextRegions(imageElement) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      ctx.drawImage(imageElement, 0, 0);
      
      // This is a simplified region detection
      // In a real implementation, you'd use more sophisticated image processing
      const regions = [
        {
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height / 4
        },
        {
          x: 0,
          y: canvas.height / 4,
          width: canvas.width,
          height: canvas.height / 4
        },
        {
          x: 0,
          y: canvas.height / 2,
          width: canvas.width,
          height: canvas.height / 4
        },
        {
          x: 0,
          y: (canvas.height * 3) / 4,
          width: canvas.width,
          height: canvas.height / 4
        }
      ];
      
      resolve(regions);
    });
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

// Create singleton instance
const ocrService = new OCRService();

export default ocrService;
