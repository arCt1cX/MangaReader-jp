import React, { useState, useRef, useEffect } from 'react';
import ocrService from '../services/ocrService';

const JapaneseTextOverlay = ({ 
  imageElement, 
  isVisible = false, 
  onTranslationRequest,
  onClose 
}) => {
  const [textRegions, setTextRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showTextBoxes, setShowTextBoxes] = useState(false);
  const overlayRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Update image size when component mounts or image changes
  useEffect(() => {
    if (imageElement && overlayRef.current) {
      const updateImageSize = () => {
        const rect = imageElement.getBoundingClientRect();
        
        setImageSize({
          width: rect.width,
          height: rect.height,
          offsetX: 0, // Simplified - overlay covers full area
          offsetY: 0
        });
        
        console.log('📐 Updated image size:', {
          width: rect.width,
          height: rect.height,
          naturalWidth: imageElement.naturalWidth,
          naturalHeight: imageElement.naturalHeight
        });
      };

      // Initial size calculation
      updateImageSize();
      
      // Update on resize
      window.addEventListener('resize', updateImageSize);
      
      // Also update when image loads (in case it wasn't loaded yet)
      imageElement.addEventListener('load', updateImageSize);
      
      return () => {
        window.removeEventListener('resize', updateImageSize);
        imageElement.removeEventListener('load', updateImageSize);
      };
    }
  }, [imageElement, isVisible]);

  // Auto-detect text regions when overlay becomes visible
  useEffect(() => {
    const detectAndSetRegions = async () => {
      if (isVisible && imageElement && textRegions.length === 0) {
        setIsAnalyzing(true);
        try {
          const regions = await generateTextRegions(imageElement);
          setTextRegions(regions);
          setShowTextBoxes(true);
        } catch (error) {
          console.error('Text region detection failed:', error);
        } finally {
          setIsAnalyzing(false);
        }
      }
    };
    
    detectAndSetRegions();
  }, [isVisible, imageElement, textRegions.length]);

  const generateTextRegions = async (image) => {
    // Create a grid of potential text regions based on typical manga layout
    const regions = [];
    const gridRows = 8;
    const gridCols = 6;
    
    // Use actual image element dimensions if imageSize is not available
    const actualWidth = imageSize.width || image.offsetWidth || image.clientWidth;
    const actualHeight = imageSize.height || image.offsetHeight || image.clientHeight;
    
    console.log('🖼️ Image dimensions for overlay:', { 
      imageSize, 
      actualWidth, 
      actualHeight,
      offsetWidth: image.offsetWidth,
      clientWidth: image.clientWidth 
    });
    
    const regionWidth = actualWidth / gridCols;
    const regionHeight = actualHeight / gridRows;
    
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        regions.push({
          id: `region-${row}-${col}`,
          x: col * regionWidth,
          y: row * regionHeight,
          width: regionWidth,
          height: regionHeight,
          text: '', // Will be populated when clicked
          confidence: 0
        });
      }
    }
    
    console.log('📍 Generated', regions.length, 'text regions');
    return regions;
  };

  const handleRegionClick = async (region, event) => {
    event.stopPropagation();
    
    console.log('🖱️ Region clicked:', region.id);
    
    if (selectedRegion?.id === region.id) {
      setSelectedRegion(null);
      return;
    }

    setIsAnalyzing(true);
    try {
      // Calculate the actual coordinates on the original image
      const scaleX = imageElement.naturalWidth / imageSize.width;
      const scaleY = imageElement.naturalHeight / imageSize.height;
      
      const boundingBox = {
        x: region.x * scaleX,
        y: region.y * scaleY,
        width: region.width * scaleX,
        height: region.height * scaleY
      };

      console.log('📍 OCR bounding box:', boundingBox);
      console.log('🖼️ Image natural size:', imageElement.naturalWidth, 'x', imageElement.naturalHeight);
      console.log('🖼️ Image display size:', imageSize.width, 'x', imageSize.height);

      // Extract text from the selected region
      const ocrResult = await ocrService.extractText(imageElement, boundingBox);
      
      console.log('🔍 OCR result:', ocrResult);
      
      if (ocrResult.success && ocrResult.text) {
        const updatedRegion = {
          ...region,
          text: ocrResult.text,
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
          text: 'No text detected',
          confidence: 0
        });
      }
    } catch (error) {
      console.error('❌ OCR failed:', error);
      setSelectedRegion({
        ...region,
        text: 'OCR failed: ' + error.message,
        confidence: 0
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOverlayClick = (event) => {
    // If clicking outside of regions, create a new region at the click position
    if (event.target === overlayRef.current) {
      const rect = overlayRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left - imageSize.offsetX;
      const y = event.clientY - rect.top - imageSize.offsetY;
      
      // Create a region around the click point
      const regionSize = Math.min(imageSize.width, imageSize.height) * 0.15;
      const newRegion = {
        id: `click-region-${Date.now()}`,
        x: Math.max(0, x - regionSize / 2),
        y: Math.max(0, y - regionSize / 2),
        width: Math.min(regionSize, imageSize.width - x + regionSize / 2),
        height: Math.min(regionSize, imageSize.height - y + regionSize / 2),
        text: '',
        confidence: 0
      };
      
      handleRegionClick(newRegion, event);
    }
  };

  if (!isVisible || !imageElement) {
    return null;
  }

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0 z-20 pointer-events-auto"
      onClick={handleOverlayClick}
    >
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
        className="absolute top-4 right-4 z-30 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Toggle text boxes button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowTextBoxes(!showTextBoxes);
        }}
        className="absolute top-4 left-4 z-30 bg-black/70 text-white px-3 py-2 rounded-lg text-sm hover:bg-black/90 transition-colors"
      >
        {showTextBoxes ? 'Hide Regions' : 'Show Regions'}
      </button>

      {/* Analysis indicator */}
      {isAnalyzing && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-black/80 text-white px-4 py-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Analyzing text...</span>
          </div>
        </div>
      )}

      {/* Text regions overlay */}
      <div 
        className="absolute z-10 inset-0"
      >
        {/* Debug info */}
        <div className="absolute top-16 left-4 z-30 bg-black/80 text-white text-xs p-2 rounded">
          Regions: {textRegions.length} | Image: {imageSize.width}x{imageSize.height}
        </div>
        
        {/* Grid regions */}
        {showTextBoxes && textRegions.map((region) => (
          <div
            key={region.id}
            className={`absolute border-2 cursor-pointer transition-all duration-200 ${
              selectedRegion?.id === region.id
                ? 'border-blue-400 bg-blue-400/30'
                : 'border-green-400 bg-green-400/20 hover:border-green-300 hover:bg-green-400/30'
            }`}
            style={{
              left: `${(region.x / imageSize.width) * 100}%`,
              top: `${(region.y / imageSize.height) * 100}%`,
              width: `${(region.width / imageSize.width) * 100}%`,
              height: `${(region.height / imageSize.height) * 100}%`
            }}
            onClick={(e) => handleRegionClick(region, e)}
            title={`Click to analyze text in region ${region.id}`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-xs bg-black/50 px-1 rounded">
                {region.id.split('-').slice(-2).join(',')}
              </span>
            </div>
            {region.text && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1 truncate">
                {region.text}
              </div>
            )}
          </div>
        ))}

        {/* Selected region highlight */}
        {selectedRegion && !showTextBoxes && (
          <div
            className="absolute border-2 border-blue-400 bg-blue-400/20"
            style={{
              left: `${(selectedRegion.x / imageSize.width) * 100}%`,
              top: `${(selectedRegion.y / imageSize.height) * 100}%`,
              width: `${(selectedRegion.width / imageSize.width) * 100}%`,
              height: `${(selectedRegion.height / imageSize.height) * 100}%`
            }}
          >
            {selectedRegion.text && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/90 text-white text-sm p-2">
                {selectedRegion.text}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
        Click anywhere on the image to extract and translate Japanese text
      </div>
    </div>
  );
};

export default JapaneseTextOverlay;
