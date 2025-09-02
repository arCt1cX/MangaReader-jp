import React, { useState, useRef, useCallback, useEffect } from 'react';
import japaneseAnalyzer from '../services/japaneseAnalyzer';
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
        const overlayRect = overlayRef.current.getBoundingClientRect();
        
        setImageSize({
          width: rect.width,
          height: rect.height,
          offsetX: rect.left - overlayRect.left,
          offsetY: rect.top - overlayRect.top
        });
      };

      updateImageSize();
      window.addEventListener('resize', updateImageSize);
      return () => window.removeEventListener('resize', updateImageSize);
    }
  }, [imageElement, isVisible]);

  // Auto-detect text regions when overlay becomes visible
  useEffect(() => {
    if (isVisible && imageElement && textRegions.length === 0) {
      detectTextRegions();
    }
  }, [isVisible, imageElement]);

  const detectTextRegions = async () => {
    if (!imageElement) return;
    
    setIsAnalyzing(true);
    try {
      // Use a simplified grid-based approach for text detection
      const regions = await generateTextRegions(imageElement);
      setTextRegions(regions);
      setShowTextBoxes(true);
    } catch (error) {
      console.error('Text region detection failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateTextRegions = async (image) => {
    // Create a grid of potential text regions based on typical manga layout
    const regions = [];
    const gridRows = 8;
    const gridCols = 6;
    
    const regionWidth = imageSize.width / gridCols;
    const regionHeight = imageSize.height / gridRows;
    
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
    
    return regions;
  };

  const handleRegionClick = async (region, event) => {
    event.stopPropagation();
    
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

      // Extract text from the selected region
      const ocrResult = await ocrService.extractText(imageElement, boundingBox);
      
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
      console.error('OCR failed:', error);
      setSelectedRegion({
        ...region,
        text: 'OCR failed',
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
        className="absolute z-10"
        style={{
          left: imageSize.offsetX,
          top: imageSize.offsetY,
          width: imageSize.width,
          height: imageSize.height
        }}
      >
        {/* Grid regions */}
        {showTextBoxes && textRegions.map((region) => (
          <div
            key={region.id}
            className={`absolute border-2 cursor-pointer transition-all duration-200 ${
              selectedRegion?.id === region.id
                ? 'border-blue-400 bg-blue-400/20'
                : 'border-green-400/50 bg-green-400/10 hover:border-green-400 hover:bg-green-400/20'
            }`}
            style={{
              left: region.x,
              top: region.y,
              width: region.width,
              height: region.height
            }}
            onClick={(e) => handleRegionClick(region, e)}
          >
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
              left: selectedRegion.x,
              top: selectedRegion.y,
              width: selectedRegion.width,
              height: selectedRegion.height
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
