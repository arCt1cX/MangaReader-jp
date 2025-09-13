import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_MANGA_SITES } from '../config/api';

const STORAGE_KEY = 'manga-sites-order';

export const useReorderableMangaSites = () => {
  const [mangaSites, setMangaSites] = useState(DEFAULT_MANGA_SITES);
  const [isReorderMode, setIsReorderMode] = useState(false);

  // Load saved order from localStorage on mount
  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem(STORAGE_KEY);
      if (savedOrder) {
        const orderIds = JSON.parse(savedOrder);
        // Reorder sites based on saved order, keeping any new sites at the end
        const reorderedSites = [];
        const siteMap = new Map(DEFAULT_MANGA_SITES.map(site => [site.id, site]));
        
        // Add sites in saved order
        orderIds.forEach(id => {
          if (siteMap.has(id)) {
            reorderedSites.push(siteMap.get(id));
            siteMap.delete(id);
          }
        });
        
        // Add any new sites that weren't in the saved order
        siteMap.forEach(site => {
          reorderedSites.push(site);
        });
        
        setMangaSites(reorderedSites);
      }
    } catch (error) {
      console.error('Failed to load manga sites order:', error);
      setMangaSites(DEFAULT_MANGA_SITES);
    }
  }, []);

  // Save order to localStorage
  const saveOrder = useCallback((sites) => {
    try {
      const orderIds = sites.map(site => site.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orderIds));
    } catch (error) {
      console.error('Failed to save manga sites order:', error);
    }
  }, []);

  // Reorder sites array
  const reorderSites = useCallback((fromIndex, toIndex) => {
    setMangaSites(prevSites => {
      const newSites = [...prevSites];
      const [movedItem] = newSites.splice(fromIndex, 1);
      newSites.splice(toIndex, 0, movedItem);
      
      // Save the new order
      saveOrder(newSites);
      
      return newSites;
    });
  }, [saveOrder]);

  // Reset to default order
  const resetOrder = useCallback(() => {
    setMangaSites(DEFAULT_MANGA_SITES);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Toggle reorder mode
  const toggleReorderMode = useCallback(() => {
    setIsReorderMode(prev => !prev);
  }, []);

  return {
    mangaSites,
    isReorderMode,
    reorderSites,
    resetOrder,
    toggleReorderMode,
    setIsReorderMode
  };
};