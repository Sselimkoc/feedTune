"use client";

import { useState, useEffect } from 'react';

/**
 * Hook to get the window dimensions and device type
 * @returns {Object} width, height, isMobile, isTablet, isDesktop
 */
export default function useWindowSize() {
  // Initialize with default values for SSR
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
    isMobile: false,
    isTablet: false,
    isDesktop: true
  });

  useEffect(() => {
    // Only execute on the client
    if (typeof window === 'undefined') return;

    // Handler to call on window resize
    function handleResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Set device type based on width
      setWindowSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      });
    }

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away to update initial size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures this runs only on mount and unmount

  return windowSize;
} 