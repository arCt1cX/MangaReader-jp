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

  // Touch handling for mobile devices - simplified approach
  const [touchStart, setTouchStart] = useState(null);
  const [touchDragging, setTouchDragging] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);

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
    
    // Start long press timer (300ms - shorter for better responsiveness)
    const timer = setTimeout(() => {
      if (touchStart && touchStart.index === index) {
        // Start drag mode
        setTouchDragging(true);
        setDraggedIndex(index);
        setIsDragging(true);
        
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        
        // Disable scrolling on container
        if (scrollContainerRef.current) {
          scrollContainerRef.current.style.overflowX = 'hidden';
        }
      }
    }, 300);
    
    setLongPressTimer(timer);
  }, [touchStart]);

  const handleTouchMove = useCallback((e, currentIndex) => {
    if (!touchStart) return;
    
    // Always prevent default to avoid scrolling conflicts
    e.preventDefault();

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    
    // If user moves before drag starts, cancel long press
    if (!touchDragging && (deltaX > 15 || deltaY > 15)) {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      setTouchStart(null);
      return;
    }
    
    if (touchDragging && draggedIndex !== null) {
      // Find which card we're over by checking touch position
      const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
      const cardElement = elementAtPoint?.closest('[data-site-index]');
      
      if (cardElement) {
        const targetIndex = parseInt(cardElement.dataset.siteIndex);
        if (targetIndex !== draggedIndex && targetIndex !== dragOverIndex) {
          setDragOverIndex(targetIndex);
        }
      }
    }
  }, [touchStart, touchDragging, longPressTimer, draggedIndex, dragOverIndex]);

  const handleTouchEnd = useCallback((e, index) => {
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Re-enable scrolling
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.overflowX = 'auto';
    }
    
    if (touchDragging && draggedIndex !== null && dragOverIndex !== null) {
      // Perform the swap
      reorderSites(draggedIndex, dragOverIndex);
    } else if (touchStart && !touchDragging) {
      // This was a tap - handle site click
      const timeDiff = Date.now() - touchStart.timestamp;
      if (timeDiff < 250) { // Quick tap
        const site = orderedSites[touchStart.index];
        onSiteClick(site);
      }
    }
    
    // Reset all touch state
    setTouchStart(null);
    setTouchDragging(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
  }, [touchDragging, draggedIndex, dragOverIndex, touchStart, orderedSites, onSiteClick, reorderSites, longPressTimer]);

  const getSiteCardClassName = (index) => {
    const baseClass = "min-w-[220px] bg-manga-gray rounded-lg p-6 cursor-pointer hover:bg-manga-light transition-all duration-200 touch-improvement group flex-shrink-0 select-none";
    
    let additionalClasses = "";
    
    if (isDragging) {
      if (index === draggedIndex) {
        additionalClasses += " opacity-60 transform scale-105 z-10 ring-2 ring-manga-accent shadow-xl";
      } else if (index === dragOverIndex) {
        additionalClasses += " transform scale-110 ring-2 ring-green-400 bg-manga-accent/10";
      } else {
        additionalClasses += " opacity-50";
      }
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
        💡 Drag and drop to reorder sites • Long press and drag on touch devices
      </p>

      {/* Scrollable sites container */}
      <div 
        ref={scrollContainerRef}
        className="flex flex-row gap-4 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-manga-accent/40 scrollbar-track-manga-gray/30 py-2 select-none"
        style={{ 
          scrollBehavior: isDragging ? 'auto' : 'smooth',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
      >
        {orderedSites.map((site, index) => (
          <div
            key={site.id}
            data-site-index={index}
            draggable={!touchDragging}
            className={getSiteCardClassName(index)}
            onClick={() => !isDragging && !touchDragging && onSiteClick(site)}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onTouchStart={(e) => handleTouchStart(e, index)}
            onTouchMove={(e) => handleTouchMove(e, index)}
            onTouchEnd={(e) => handleTouchEnd(e, index)}
            style={{
              touchAction: 'none', // Always prevent default touch behaviors
              userSelect: 'none',  // Prevent text selection
              WebkitUserSelect: 'none', // Safari
              WebkitTouchCallout: 'none', // Safari callout
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