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
      
      console.log('📊 OCR Analysis Results:', {
        text: fullImageResult.text,
        confidence: fullImageResult.confidence,
        success: fullImageResult.success,
        textLength: fullImageResult.text?.length || 0
      });
      
      if (fullImageResult.success && fullImageResult.text && fullImageResult.text.length > 5) {
        console.log('📝 Full image OCR result:', fullImageResult.text);
        
        // For now, create some smart regions based on typical manga layout
        // In a real implementation, you'd use the OCR engine's word/line detection
        const regions = await createTextRegionsFromOCR(imageElement);
        setDetectedTextRegions(regions);
        
        console.log(`✅ Created ${regions.length} text regions`);
      } else {
        console.log('❌ No significant text detected in image (text too short or low confidence)');
        // Still create some basic regions for manual interaction
        const basicRegions = await createTextRegionsFromOCR(imageElement);
        setDetectedTextRegions(basicRegions.slice(0, 4)); // Just show a few regions
        console.log(`📝 Created ${basicRegions.slice(0, 4).length} basic regions for manual interaction`);
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
    
    // Use actual image dimensions, not display dimensions
    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;
    
    console.log(`📐 Creating regions for image: ${imageWidth}x${imageHeight}`);
    
    // Much smaller, more targeted regions for better accuracy
    const commonTextAreas = [
      // Small test regions in strategic positions
      { x: 0.25, y: 0.15, width: 0.2, height: 0.1, type: 'speech' },
      { x: 0.55, y: 0.15, width: 0.2, height: 0.1, type: 'speech' },
      { x: 0.25, y: 0.35, width: 0.2, height: 0.1, type: 'dialogue' },
      { x: 0.55, y: 0.35, width: 0.2, height: 0.1, type: 'dialogue' },
      { x: 0.25, y: 0.55, width: 0.2, height: 0.1, type: 'thought' },
      { x: 0.55, y: 0.55, width: 0.2, height: 0.1, type: 'thought' },
      { x: 0.2, y: 0.75, width: 0.6, height: 0.1, type: 'narration' }
    ];

    for (let i = 0; i < commonTextAreas.length; i++) {
      const area = commonTextAreas[i];
      regions.push({
        id: `text-${area.type}-${i}`,
        x: Math.round(area.x * imageWidth),
        y: Math.round(area.y * imageHeight),
        width: Math.round(area.width * imageWidth),
        height: Math.round(area.height * imageHeight),
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
      // Use the region coordinates directly (they're already in natural image dimensions)
      const boundingBox = {
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height
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
        
        // Update the region in the list
        setDetectedTextRegions(prev => 
          prev.map(r => r.id === region.id ? updatedRegion : r)
        );
        
        // Calculate position for translation popup
        const imageRect = imageElement.getBoundingClientRect();
        const scaleX = imageRect.width / imageElement.naturalWidth;
        const scaleY = imageRect.height / imageElement.naturalHeight;
        
        const popupPosition = {
          x: imageRect.left + (region.x * scaleX),
          y: imageRect.top + (region.y * scaleY)
        };
        
        // Request translation for the extracted text
        if (onTranslationRequest) {
          onTranslationRequest({
            ...updatedRegion,
            position: popupPosition
          });
        }
      } else {
        setSelectedRegion({
          ...region,
          text: 'No readable Japanese text found in this area',
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
      {detectedTextRegions.map((region) => {
        // Calculate scaling factors to convert from natural image coordinates to display coordinates
        const displayRect = imageElement.getBoundingClientRect();
        const scaleX = displayRect.width / imageElement.naturalWidth;
        const scaleY = displayRect.height / imageElement.naturalHeight;
        
        return (
          <div
            key={region.id}
            className={`absolute border-2 cursor-pointer transition-all duration-200 ${
              selectedRegion?.id === region.id
                ? 'border-white bg-white/20 ring-2 ring-white/50'
                : `${getRegionColor(region.type)} hover:bg-opacity-30 hover:border-opacity-80`
            }`}
            style={{
              left: region.x * scaleX,
              top: region.y * scaleY,
              width: region.width * scaleX,
              height: region.height * scaleY
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
        );
      })}
    </div>
  );
};

export default JapaneseTextOverlay;
