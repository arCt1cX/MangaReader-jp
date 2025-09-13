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

  const handleTouchStart = useCallback((e, index) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      index,
      timestamp: Date.now()
    });
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStart) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    
    // Start dragging if moved more than 10px and primarily horizontal
    if (!touchDragging && deltaX > 10 && deltaX > deltaY) {
      setTouchDragging(true);
      setDraggedIndex(touchStart.index);
      setIsDragging(true);
      e.preventDefault(); // Prevent scrolling
    }
    
    if (touchDragging) {
      setTouchCurrent({
        x: touch.clientX,
        y: touch.clientY
      });
      e.preventDefault();
    }
  }, [touchStart, touchDragging]);

  const handleTouchEnd = useCallback((e) => {
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
    } else if (touchStart && !touchDragging) {
      // This was a tap, not a drag
      const timeDiff = Date.now() - touchStart.timestamp;
      if (timeDiff < 300) { // Quick tap
        const site = orderedSites[touchStart.index];
        onSiteClick(site);
      }
    }
    
    // Reset touch state
    setTouchStart(null);
    setTouchCurrent(null);
    setTouchDragging(false);
    handleDragEnd();
  }, [touchDragging, touchCurrent, draggedIndex, touchStart, orderedSites, onSiteClick, reorderSites, handleDragEnd]);

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
        💡 Drag and drop to reorder sites • Touch and hold on mobile
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
            onClick={() => !isDragging && !touchDragging && onSiteClick(site)}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onTouchStart={(e) => handleTouchStart(e, index)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              touchAction: touchDragging ? 'none' : 'manipulation'
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