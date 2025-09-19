import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);

  useEffect(() => {
    try {
      const supportsEnv = typeof window !== 'undefined' && CSS && typeof CSS.supports === 'function' && (
        CSS.supports('padding-bottom: env(safe-area-inset-bottom)') || CSS.supports('padding-bottom: constant(safe-area-inset-bottom)')
      );

      // Check if running as a standalone PWA (iOS and other platforms)
      const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const navigatorStandalone = window.navigator && (window.navigator.standalone === true);

      if (navRef.current && !supportsEnv && (isStandalone || navigatorStandalone)) {
        navRef.current.classList.add('fallback-legacy');
      }
    } catch (e) {
      // If CSS.supports isn't available, assume older iOS and add fallback
      if (navRef.current && (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone)) {
        navRef.current.classList.add('fallback-legacy');
      }
    }
  }, []);

  // Don't show navigation on reader page for full immersion
  if (location.pathname.includes('/reader/')) {
    return null;
  }

  const navItems = [
    {
      path: '/',
      icon: 'home',
      label: 'Home',
      active: location.pathname === '/'
    },
    {
      path: '/library',
      icon: 'library',
      label: 'Library',
      active: location.pathname === '/library'
    },
    {
      path: '/settings',
      icon: 'settings',
      label: 'Settings',
      active: location.pathname === '/settings'
    }
  ];
  

  return (
    <nav ref={navRef} className="fixed bottom-0 left-0 right-0 bg-manga-gray border-t border-manga-light z-50 safe-fill-bottom">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors touch-improvement ${
                item.active 
                  ? 'text-manga-accent bg-manga-accent/10' 
                  : 'text-manga-text/70 hover:text-manga-text hover:bg-manga-light/50'
              }`}
            >
              <div className="mb-1">
                <Icon 
                  name={item.icon} 
                  size={20} 
                  color={item.active ? 'var(--accent)' : 'currentColor'} 
                />
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
