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
        preserve_interword_spaces: '0'
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

      console.log('🔍 Running OCR recognition...');
      const { data: { text, confidence } } = await this.worker.recognize(canvas);
      
      console.log(`📝 OCR Result: "${text.trim()}" (confidence: ${confidence}%)`);
      
      return {
        text: text.trim(),
        confidence,
        success: confidence > 60 // Consider successful if confidence > 60%
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