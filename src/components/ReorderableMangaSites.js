import React, { useState, useRef, useCallback } from 'react';
import { useMangaSitesOrder } from '../hooks/useMangaSitesOrder';

const ReorderableMangaSites = ({ onSiteClick }) => {
  const { orderedSites, reorderSites, resetOrder } = useMangaSitesOrder();
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const scrollContainerRef = useRef(null);
  const dragScrollIntervalRef = useRef(null);

  // Auto-scroll while dragging near edges
  const handleAutoScroll = useCallback((clientX) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const scrollZoneWidth = 100;
    const scrollSpeed = 5;

    if (clientX < rect.left + scrollZoneWidth) {
      // Scroll left
      container.scrollLeft -= scrollSpeed;
    } else if (clientX > rect.right - scrollZoneWidth) {
      // Scroll right
      container.scrollLeft += scrollSpeed;
    }
  }, []);

  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index);
    setIsDragging(true);
    
    // Set drag effect
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Required for some browsers
    
    // Add drag image
    const dragImage = e.target.cloneNode(true);
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(2deg)';
    e.dataTransfer.setDragImage(dragImage, 110, 50);

    // Start auto-scroll monitoring
    dragScrollIntervalRef.current = setInterval(() => {
      if (e.clientX) {
        handleAutoScroll(e.clientX);
      }
    }, 50);
  }, [handleAutoScroll]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
    
    // Clear auto-scroll
    if (dragScrollIntervalRef.current) {
      clearInterval(dragScrollIntervalRef.current);
      dragScrollIntervalRef.current = null;
    }
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index);
    }
    
    // Update auto-scroll position
    handleAutoScroll(e.clientX);
  }, [draggedIndex, handleAutoScroll]);

  const handleDragLeave = useCallback((e) => {
    // Only clear drag over if we're leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeavingContainer = (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    );
    
    if (isLeavingContainer) {
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex !== null && dropIndex !== draggedIndex) {
      reorderSites(draggedIndex, dropIndex);
    }
    
    handleDragEnd();
  }, [draggedIndex, reorderSites, handleDragEnd]);

  // Touch handling for mobile devices
  const [touchStart, setTouchStart] = useState(null);
  const [touchCurrent, setTouchCurrent] = useState(null);
  const [touchDragging, setTouchDragging] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [longPressActive, setLongPressActive] = useState(null); // Index of card being long-pressed

  const handleTouchStart = useCallback((e, index) => {
    // Prevent text selection immediately
    e.preventDefault();
    
    const touch = e.touches[0];
    const startData = {
      x: touch.clientX,
      y: touch.clientY,
      index,
      timestamp: Date.now()
    };
    
    setTouchStart(startData);
    setLongPressActive(index); // Show visual feedback
    
    // Start long press timer for drag initiation (400ms - shorter for better UX)
    const timer = setTimeout(() => {
      // Initiate drag mode after long press
      if (!touchDragging && touchStart && touchStart.index === index) {
        setTouchDragging(true);
        setDraggedIndex(index);
        setIsDragging(true);
        
        // Provide haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate([50, 30, 50]); // Double pulse for drag start
        }
        
        // Prevent any scrolling once drag starts
        document.body.style.overflow = 'hidden';
        if (scrollContainerRef.current) {
          scrollContainerRef.current.style.overflowX = 'hidden';
        }
      }
    }, 400); // Reduced from 500ms
    
    setLongPressTimer(timer);
  }, [touchDragging, touchStart]);

  const handleTouchMove = useCallback((e) => {
    if (!touchStart) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Clear long press timer if user moves significantly before drag starts
    if (!touchDragging && totalMovement > 15) {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      setLongPressActive(null); // Clear visual feedback
      
      // If movement is primarily horizontal, this is likely a scroll gesture
      // Don't prevent default to allow normal scrolling
      return;
    }
    
    if (touchDragging) {
      // Prevent all default behavior during dragging
      e.preventDefault();
      e.stopPropagation();
      
      setTouchCurrent({
        x: touch.clientX,
        y: touch.clientY
      });
      
      // Find the element currently under the touch point
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const siteCard = elementBelow?.closest('[data-site-index]');
      
      if (siteCard) {
        const targetIndex = parseInt(siteCard.dataset.siteIndex);
        if (targetIndex !== draggedIndex) {
          setDragOverIndex(targetIndex);
        }
      }
    }
  }, [touchStart, touchDragging, longPressTimer, draggedIndex]);

  const handleTouchEnd = useCallback((e) => {
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Restore scrolling
    document.body.style.overflow = '';
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.overflowX = 'auto';
    }
    
    if (touchDragging && touchCurrent && draggedIndex !== null) {
      // Find the drop target based on touch position
      const elements = document.elementsFromPoint(touchCurrent.x, touchCurrent.y);
      const dropTarget = elements.find(el => el.dataset.siteIndex);
      
      if (dropTarget) {
        const dropIndex = parseInt(dropTarget.dataset.siteIndex);
        if (dropIndex !== draggedIndex) {
          reorderSites(draggedIndex, dropIndex);
        }
      }
    } else if (touchStart && !touchDragging && longPressActive === null) {
      // This was a clean tap (no movement, no long press started)
      const timeDiff = Date.now() - touchStart.timestamp;
      const touch = e.changedTouches[0];
      const deltaX = Math.abs(touch.clientX - touchStart.x);
      const deltaY = Math.abs(touch.clientY - touchStart.y);
      const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Only trigger click if it was a quick tap with minimal movement
      if (timeDiff < 200 && totalMovement < 10) {
        const site = orderedSites[touchStart.index];
        onSiteClick(site);
      }
    }
    
    // Reset touch state
    setTouchStart(null);
    setTouchCurrent(null);
    setTouchDragging(false);
    setLongPressActive(null); // Clear visual feedback
    handleDragEnd();
  }, [touchDragging, touchCurrent, draggedIndex, touchStart, orderedSites, onSiteClick, reorderSites, handleDragEnd, longPressTimer, longPressActive]);

  // Custom click handler for better control
  const handleCardClick = useCallback((e, site) => {
    // Only handle clicks on non-touch devices or if explicitly called
    if (e.type === 'click' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      // This is a touch device, ignore click events as we handle them in touch events
      e.preventDefault();
      return;
    }
    
    if (!isDragging && !touchDragging) {
      onSiteClick(site);
    }
  }, [isDragging, touchDragging, onSiteClick]);

  const getSiteCardClassName = (index) => {
    const baseClass = "min-w-[220px] bg-manga-gray rounded-lg p-6 cursor-pointer hover:bg-manga-light transition-all duration-200 touch-improvement group flex-shrink-0";
    
    let additionalClasses = "";
    
    if (isDragging) {
      if (index === draggedIndex) {
        additionalClasses += " opacity-50 transform scale-95 z-10";
      } else if (index === dragOverIndex) {
        additionalClasses += " transform scale-105 ring-2 ring-manga-accent ring-opacity-50";
      } else {
        additionalClasses += " opacity-75";
      }
    }
    
    if (touchDragging && index === draggedIndex) {
      additionalClasses += " shadow-2xl transform rotate-1";
    }
    
    if (longPressActive === index && !touchDragging) {
      additionalClasses += " transform scale-105 ring-2 ring-manga-accent/30 ring-pulse";
    }
    
    return `${baseClass} ${additionalClasses}`;
  };

  return (
    <div className="space-y-4">
      {/* Header with reset option */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-manga-text">
          🌐 Browse Manga Sites
        </h2>
        <button
          onClick={resetOrder}
          className="text-sm text-manga-text/50 hover:text-manga-accent transition-colors px-2 py-1 rounded"
          title="Reset to default order"
        >
          Reset Order
        </button>
      </div>

      {/* Drag instruction hint */}
      <p className="text-xs text-manga-text/40 -mt-2">
        💡 Desktop: Drag to reorder • Mobile: Tap to open, Long press + drag to reorder
      </p>

      {/* Scrollable sites container */}
      <div 
        ref={scrollContainerRef}
        className="flex flex-row gap-4 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-manga-accent/40 scrollbar-track-manga-gray/30 py-2"
        style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
      >
        {orderedSites.map((site, index) => (
          <div
            key={site.id}
            data-site-index={index}
            draggable={!touchDragging}
            className={getSiteCardClassName(index)}
            onClick={(e) => handleCardClick(e, site)}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onTouchStart={(e) => handleTouchStart(e, index)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              touchAction: touchDragging ? 'none' : longPressActive === index ? 'none' : 'pan-x',
              userSelect: 'none', // Prevent text selection
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none', // Prevent iOS callout menu
              WebkitTapHighlightColor: 'transparent' // Remove tap highlight
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <img
                src={site.logo}
                alt={site.name + ' logo'}
                className="w-8 h-8 rounded"
                style={{ objectFit: 'contain', background: '#fff' }}
                draggable={false}
              />
              <div className="text-manga-text/30 cursor-grab active:cursor-grabbing">
                ⋮⋮
              </div>
            </div>
            
            <h3 className="font-semibold text-manga-text group-hover:text-manga-accent transition-colors">
              {site.name}
            </h3>
            <p className="text-sm text-manga-text/70 mt-1">
              {site.description}
            </p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-manga-text/50">
                {site.url}
              </span>
              <div className="text-manga-accent group-hover:transform group-hover:translate-x-1 transition-transform">
                →
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReorderableMangaSites;