import Tesseract from 'tesseract.js';

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  async initialize() {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  async _doInitialize() {
    try {
      console.log('🔧 Initializing OCR Service...');
      
      // Create worker using Tesseract.js v4 API
      this.worker = await Tesseract.createWorker({
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      await this.worker.loadLanguage('jpn');
      await this.worker.initialize('jpn');

      console.log('🔧 Setting OCR parameters...');
      await this.worker.setParameters({
        tessedit_pageseg_mode: '6', // SINGLE_BLOCK
        tessedit_char_whitelist: 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンー一二三四五六七八九十百千万ぁぃぅぇぉっゃゅょァィゥェォッャュョ',
        preserve_interword_spaces: '0',
        tessedit_write_images: '0' // Don't write debug images
      });

      this.isInitialized = true;
      console.log('✅ OCR Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OCR:', error);
      this.initializationPromise = null;
      // Try to cleanup if initialization failed
      if (this.worker) {
        try {
          await this.worker.terminate();
        } catch (cleanupError) {
          console.error('Cleanup failed:', cleanupError);
        }
        this.worker = null;
      }
      throw error;
    }
  }

  async extractText(imageElement, boundingBox = null) {
    try {
      await this.initialize();
    } catch (error) {
      console.error('❌ OCR initialization failed, returning empty result:', error);
      return {
        text: '',
        confidence: 0,
        success: false,
        error: 'OCR initialization failed'
      };
    }

    if (!this.worker) {
      console.error('❌ OCR worker not available');
      return {
        text: '',
        confidence: 0,
        success: false,
        error: 'OCR worker not available'
      };
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

      // Preprocess image for better OCR results
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Convert to grayscale and increase contrast for better OCR
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        // Increase contrast
        const contrast = gray > 128 ? 255 : 0;
        data[i] = contrast;     // red
        data[i + 1] = contrast; // green
        data[i + 2] = contrast; // blue
      }
      
      ctx.putImageData(imageData, 0, 0);

      console.log('🔍 Running OCR recognition...');
      const { data: { text, confidence } } = await this.worker.recognize(canvas);
      
      console.log(`📝 OCR Result: "${text.trim()}" (confidence: ${confidence}%)`);
      
      return {
        text: text.trim(),
        confidence,
        success: confidence > 30 // Lower threshold for manga OCR (was 60%)
      };
    } catch (error) {
      console.error('❌ OCR extraction failed:', error);
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
      try {
        await this.worker.terminate();
        console.log('✅ OCR worker terminated');
      } catch (error) {
        console.error('❌ Error terminating OCR worker:', error);
      }
      this.worker = null;
      this.isInitialized = false;
      this.initializationPromise = null;
    }
  }
}

// Create singleton instance
const ocrService = new OCRService();

export default ocrService;