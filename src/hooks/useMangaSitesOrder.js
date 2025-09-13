import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_MANGA_SITES } from '../config/api';

const STORAGE_KEY = 'manga-sites-order';

export const useMangaSitesOrder = () => {
  const [orderedSites, setOrderedSites] = useState(DEFAULT_MANGA_SITES);

  // Load saved order from localStorage on mount
  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem(STORAGE_KEY);
      if (savedOrder) {
        const siteIds = JSON.parse(savedOrder);
        
        // Reorder sites based on saved order, maintaining any new sites
        const reorderedSites = [];
        const siteMap = new Map(DEFAULT_MANGA_SITES.map(site => [site.id, site]));
        
        // Add sites in saved order
        siteIds.forEach(id => {
          if (siteMap.has(id)) {
            reorderedSites.push(siteMap.get(id));
            siteMap.delete(id);
          }
        });
        
        // Add any new sites that weren't in the saved order
        siteMap.forEach(site => {
          reorderedSites.push(site);
        });
        
        setOrderedSites(reorderedSites);
      }
    } catch (error) {
      console.error('Error loading manga sites order from localStorage:', error);
      setOrderedSites(DEFAULT_MANGA_SITES);
    }
  }, []);

  // Save order to localStorage
  const saveOrder = useCallback((newOrder) => {
    try {
      const siteIds = newOrder.map(site => site.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(siteIds));
      setOrderedSites(newOrder);
    } catch (error) {
      console.error('Error saving manga sites order to localStorage:', error);
    }
  }, []);

  // Reorder sites by moving a site from one index to another
  const reorderSites = useCallback((fromIndex, toIndex) => {
    const newOrder = [...orderedSites];
    const [movedSite] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedSite);
    saveOrder(newOrder);
  }, [orderedSites, saveOrder]);

  // Reset to default order
  const resetOrder = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setOrderedSites(DEFAULT_MANGA_SITES);
    } catch (error) {
      console.error('Error resetting manga sites order:', error);
    }
  }, []);

  return {
    orderedSites,
    reorderSites,
    resetOrder,
    saveOrder
  };
};