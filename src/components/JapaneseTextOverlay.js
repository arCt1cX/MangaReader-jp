import React, { useState, useRef, useEffect } from 'react';
import ocrService from '../services/ocrService';
import { useSettings } from '../contexts/SettingsContext';

const JapaneseTextOverlay = ({ 
  imageElement, 
  isVisible = false, 
  onTranslationRequest,
  onClose 
}) => {
  const { settings } = useSettings();
  const [detectedTextRegions, setDetectedTextRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const overlayRef = useRef(null);

  // Auto-detect text when overlay becomes visible
  useEffect(() => {
    if (isVisible && imageElement && !analysisComplete && settings.japaneseHelper.enabled) {
      performFullPageOCR();
    }
  }, [isVisible, imageElement, settings.japaneseHelper.enabled]);

  const performFullPageOCR = async () => {
    if (!imageElement || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setDetectedTextRegions([]);
    
    try {
      console.log('� Starting full page OCR analysis...');
      
      // Perform OCR on the entire image first to get all text
      const fullImageResult = await ocrService.extractText(imageElement);
      
      if (fullImageResult.success && fullImageResult.text) {
        console.log('📝 Full image OCR result:', fullImageResult.text);
        
        // For now, create some smart regions based on typical manga layout
        // In a real implementation, you'd use the OCR engine's word/line detection
        const regions = await createTextRegionsFromOCR(imageElement);
        setDetectedTextRegions(regions);
        
        console.log(`✅ Created ${regions.length} text regions`);
      } else {
        console.log('❌ No text detected in image');
      }
    } catch (error) {
      console.error('❌ OCR analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }
  };

  const createTextRegionsFromOCR = async (image) => {
    // Create strategic regions where manga text typically appears
    const regions = [];
    const rect = image.getBoundingClientRect();
    
    // Speech bubbles are typically in upper areas, thought bubbles at top
    // Text boxes usually at bottom, sound effects scattered
    const commonTextAreas = [
      // Top area - thought bubbles
      { x: 0.1, y: 0.05, width: 0.8, height: 0.2, type: 'thought' },
      // Upper middle - speech bubbles
      { x: 0.05, y: 0.15, width: 0.4, height: 0.3, type: 'speech' },
      { x: 0.55, y: 0.15, width: 0.4, height: 0.3, type: 'speech' },
      // Middle areas - dialogue
      { x: 0.1, y: 0.35, width: 0.35, height: 0.25, type: 'dialogue' },
      { x: 0.55, y: 0.35, width: 0.35, height: 0.25, type: 'dialogue' },
      // Lower area - narration boxes
      { x: 0.05, y: 0.7, width: 0.9, height: 0.25, type: 'narration' },
      // Side areas - sound effects
      { x: 0.02, y: 0.2, width: 0.15, height: 0.6, type: 'sfx' },
      { x: 0.83, y: 0.2, width: 0.15, height: 0.6, type: 'sfx' }
    ];

    for (let i = 0; i < commonTextAreas.length; i++) {
      const area = commonTextAreas[i];
      regions.push({
        id: `text-${area.type}-${i}`,
        x: area.x * rect.width,
        y: area.y * rect.height,
        width: area.width * rect.width,
        height: area.height * rect.height,
        type: area.type,
        text: '',
        confidence: 0
      });
    }

    return regions;
  };

  const handleRegionClick = async (region, event) => {
    event.stopPropagation();
    
    console.log('🖱️ Clicked text region:', region.id, region.type);
    
    if (selectedRegion?.id === region.id) {
      setSelectedRegion(null);
      return;
    }

    setIsAnalyzing(true);
    try {
      // Calculate coordinates on the original image
      const scaleX = imageElement.naturalWidth / imageElement.offsetWidth;
      const scaleY = imageElement.naturalHeight / imageElement.offsetHeight;
      
      const boundingBox = {
        x: region.x * scaleX,
        y: region.y * scaleY,
        width: region.width * scaleX,
        height: region.height * scaleY
      };

      console.log('📍 OCR bounding box:', boundingBox);

      // Extract text from the selected region
      const ocrResult = await ocrService.extractText(imageElement, boundingBox);
      
      console.log('🔍 Region OCR result:', ocrResult);
      
      if (ocrResult.success && ocrResult.text.trim()) {
        const updatedRegion = {
          ...region,
          text: ocrResult.text.trim(),
          confidence: ocrResult.confidence
        };
        
        setSelectedRegion(updatedRegion);
        
        // Request translation for the extracted text
        if (onTranslationRequest) {
          onTranslationRequest(updatedRegion);
        }
      } else {
        setSelectedRegion({
          ...region,
          text: 'No Japanese text detected in this area',
          confidence: 0
        });
      }
    } catch (error) {
      console.error('❌ OCR failed:', error);
      setSelectedRegion({
        ...region,
        text: `OCR Error: ${error.message}`,
        confidence: 0
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRegionColor = (type) => {
    switch (type) {
      case 'speech': return 'border-blue-400 bg-blue-400/15';
      case 'thought': return 'border-purple-400 bg-purple-400/15';
      case 'dialogue': return 'border-green-400 bg-green-400/15';
      case 'narration': return 'border-yellow-400 bg-yellow-400/15';
      case 'sfx': return 'border-red-400 bg-red-400/15';
      default: return 'border-gray-400 bg-gray-400/15';
    }
  };

  if (!isVisible || !imageElement || !settings.japaneseHelper.enabled) {
    return null;
  }

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0 z-20 pointer-events-auto"
    >
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
        className="absolute top-4 right-4 z-30 bg-black/80 text-white p-2 rounded-full hover:bg-black/90 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Analysis status */}
      {isAnalyzing && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-black/80 text-white px-4 py-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Analyzing Japanese text...</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      {analysisComplete && detectedTextRegions.length > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 bg-black/80 text-white px-4 py-2 rounded-lg text-sm text-center">
          Click on colored regions to extract and translate Japanese text
        </div>
      )}

      {/* No text found message */}
      {analysisComplete && detectedTextRegions.length === 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-black/80 text-white px-4 py-2 rounded-lg text-center">
          <p>No text regions detected.</p>
          <p className="text-sm text-gray-300 mt-1">This image might not contain readable Japanese text.</p>
        </div>
      )}

      {/* Detected text regions */}
      {detectedTextRegions.map((region) => (
        <div
          key={region.id}
          className={`absolute border-2 cursor-pointer transition-all duration-200 ${
            selectedRegion?.id === region.id
              ? 'border-white bg-white/20 ring-2 ring-white/50'
              : `${getRegionColor(region.type)} hover:bg-opacity-30 hover:border-opacity-80`
          }`}
          style={{
            left: region.x,
            top: region.y,
            width: region.width,
            height: region.height
          }}
          onClick={(e) => handleRegionClick(region, e)}
          title={`Click to analyze ${region.type} text`}
        >
          {/* Region type indicator */}
          <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
            {region.type}
          </div>
          
          {/* Extracted text display */}
          {region.text && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1 max-h-8 overflow-hidden">
              {region.text}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default JapaneseTextOverlay;
