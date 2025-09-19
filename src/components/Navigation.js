import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
    <nav
      className="fixed bottom-0 left-0 right-0 bg-manga-gray border-t border-manga-light z-50"
      style={{
        // Remove paddingBottom, only background fills safe area
        boxShadow: '0 -1px 0 0 var(--manga-light)',
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Pseudo-element for safe area background fill */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 'env(safe-area-inset-bottom)',
          background: 'inherit',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      <div className="max-w-4xl mx-auto px-4" style={{ position: 'relative', zIndex: 2 }}>
        <div
          className="flex items-center justify-around py-2"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
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
