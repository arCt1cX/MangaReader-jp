import React, { useState, useRef, useCallback } from 'react';

const ReorderableMangaCard = ({ 
  site, 
  index, 
  onReorder, 
  isReorderMode, 
  setIsReorderMode,
  onSiteClick
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isPressed, setIsPressed] = useState(false);
  const cardRef = useRef(null);
  const dragStartPos = useRef(null);
  const isDragStarted = useRef(false);

  // Long press detection constants
  const LONG_PRESS_DURATION = 500; // 0.5 seconds
  const DRAG_THRESHOLD = 10; // pixels

  // Handle long press to enter reorder mode
  const handleLongPress = useCallback(() => {
    setIsReorderMode(true);
    console.log('Long press detected - entering reorder mode');
  }, [setIsReorderMode]);

  // Handle regular click to navigate
  const handleClick = useCallback(() => {
    if (!isReorderMode && onSiteClick) {
      onSiteClick();
    }
  }, [isReorderMode, onSiteClick]);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    setIsPressed(true);
    dragStartPos.current = { x: e.clientX || e.touches?.[0]?.clientX, y: e.clientY || e.touches?.[0]?.clientY };
    isDragStarted.current = false;

    // Start long press timer
    const timer = setTimeout(() => {
      if (!isDragStarted.current) {
        setIsPressed(false);
        handleLongPress();
        
        // Add haptic feedback for supported devices
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, LONG_PRESS_DURATION);
    
    setLongPressTimer(timer);
  }, [handleLongPress]);

  const handlePointerMove = useCallback((e) => {
    if (!isPressed || !dragStartPos.current) return;

    const currentX = e.clientX || e.touches?.[0]?.clientX;
    const currentY = e.clientY || e.touches?.[0]?.clientY;
    
    const deltaX = currentX - dragStartPos.current.x;
    const deltaY = currentY - dragStartPos.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // If moved beyond threshold, cancel long press and start drag if in reorder mode
    if (distance > DRAG_THRESHOLD) {
      isDragStarted.current = true;
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      setIsPressed(false);

      if (isReorderMode) {
        setIsDragging(true);
        setDragOffset({ x: deltaX, y: deltaY });
      }
    }
  }, [isPressed, isReorderMode, longPressTimer]);

  const handlePointerUp = useCallback((e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (isDragging) {
      // Handle drop logic
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      
      // Find drop target
      const dropTarget = document.elementFromPoint(
        e.clientX || e.changedTouches?.[0]?.clientX, 
        e.clientY || e.changedTouches?.[0]?.clientY
      );
      
      if (dropTarget) {
        const dropCard = dropTarget.closest('[data-site-index]');
        if (dropCard) {
          const dropIndex = parseInt(dropCard.dataset.siteIndex);
          if (dropIndex !== index && !isNaN(dropIndex)) {
            onReorder(index, dropIndex);
          }
        }
      }
    } else if (isPressed && !isDragStarted.current) {
      // Regular click
      setIsPressed(false);
      if (!isReorderMode) {
        handleClick();
      }
    }

    setIsPressed(false);
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    dragStartPos.current = null;
    isDragStarted.current = false;
  }, [isDragging, isPressed, index, onReorder, handleClick, isReorderMode]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  const cardStyle = {
    transform: isDragging ? `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.05)` : 'none',
    zIndex: isDragging ? 1000 : 'auto',
    transition: isDragging ? 'none' : 'all 0.2s ease',
  };

  return (
    <div
      ref={cardRef}
      data-site-index={index}
      style={cardStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      className={`min-w-[220px] rounded-lg p-6 cursor-pointer transition-all duration-200 flex-shrink-0 select-none
        ${isDragging 
          ? 'bg-manga-accent/20 border-2 border-manga-accent shadow-lg' 
          : isReorderMode
          ? 'bg-manga-gray border-2 border-dashed border-manga-accent/50 hover:border-manga-accent'
          : 'bg-manga-gray hover:bg-manga-light'
        }
        ${isPressed ? 'scale-95' : ''}
        ${isReorderMode ? 'animate-pulse' : ''}
        group touch-manipulation
      `}
    >
      {isReorderMode && (
        <div className="absolute -top-2 -right-2 bg-manga-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          ⋮⋮
        </div>
      )}
      
      <img
        src={site.logo}
        alt={site.name + ' logo'}
        className="w-8 h-8 mb-3 rounded pointer-events-none"
        style={{ objectFit: 'contain', background: '#fff' }}
      />
      <h3 className={`font-semibold transition-colors pointer-events-none
        ${isReorderMode 
          ? 'text-manga-accent' 
          : 'text-manga-text group-hover:text-manga-accent'
        }`}>
        {site.name}
      </h3>
      <p className="text-sm text-manga-text/70 mt-1 pointer-events-none">
        {site.description}
      </p>
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-manga-text/50 pointer-events-none">
          {site.url}
        </span>
        {!isReorderMode && (
          <div className="text-manga-accent group-hover:transform group-hover:translate-x-1 transition-transform pointer-events-none">
            →
          </div>
        )}
      </div>
    </div>
  );
};

export default ReorderableMangaCard;