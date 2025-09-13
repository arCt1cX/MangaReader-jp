import React, { useState, useEffect } from 'react';
import logo192 from '../icon-192.png';
const logoSrc = typeof logo192 === 'string' ? logo192 : logo192.default;

const THEME_COLORS = {
  standard: {
    bg: 'from-manga-dark via-manga-gray to-manga-dark',
    accent: 'manga-accent',
    accentHex: '#3b82f6',
    text: 'white',
    ring: 'border-manga-accent/30',
    badge: 'bg-manga-gray/50',
    gradient: 'from-manga-accent to-blue-600',
    particle: 'bg-manga-accent/30',
  },
  dark: {
    bg: 'from-black via-purple-900 to-black',
    accent: 'purple-500',
    accentHex: '#a78bfa',
    text: 'white',
    ring: 'border-purple-500/30',
    badge: 'bg-purple-900/50',
    gradient: 'from-purple-500 to-black',
    particle: 'bg-purple-500/30',
  },
  amoled: {
    bg: 'from-black via-gray-900 to-black',
    accent: 'purple-400',
    accentHex: '#c084fc',
    text: 'white',
    ring: 'border-purple-400/30',
    badge: 'bg-gray-900/50',
    gradient: 'from-purple-400 to-black',
    particle: 'bg-purple-400/30',
  },
  light: {
    bg: 'from-white via-blue-100 to-white',
    accent: 'blue-500',
    accentHex: '#3b82f6',
    text: 'manga-dark',
    ring: 'border-blue-500/30',
    badge: 'bg-blue-100/50',
    gradient: 'from-blue-500 to-white',
    particle: 'bg-blue-500/30',
  },
};

const SplashScreen = ({ onComplete, theme = 'standard' }) => {
  const [animationPhase, setAnimationPhase] = useState('initial'); // initial -> logo -> text -> fadeOut
  const colors = THEME_COLORS[theme] || THEME_COLORS.standard;

  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationPhase('logo'), 300);
    const timer2 = setTimeout(() => setAnimationPhase('text'), 1000);
    const timer3 = setTimeout(() => setAnimationPhase('fadeOut'), 2200);
    const timer4 = setTimeout(onComplete, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-gradient-to-br ${colors.bg} flex flex-col items-center justify-center transition-opacity duration-600 ${
      animationPhase === 'fadeOut' ? 'opacity-0' : 'opacity-100'
    }`}>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, ${colors.accentHex}22 0%, transparent 70%),
                           radial-gradient(circle at 75% 75%, ${colors.accentHex}22 0%, transparent 70%)`
        }} />
      </div>
      
      {/* Main Logo Container */}
          <div className="relative z-10 flex flex-col items-center mt-2">
        
        {/* Logo Circle with Book Icon */}
        <div className={`relative mb-8 transition-all duration-1000 ease-out ${
          animationPhase === 'initial' 
            ? 'scale-0 rotate-180 opacity-0' 
            : animationPhase === 'logo'
            ? 'scale-100 rotate-0 opacity-100'
            : 'scale-110 rotate-0 opacity-100'
        }`}>
          
          {/* Animated Ring */}
          <div className={`absolute inset-0 w-32 h-32 rounded-full border-4 ${colors.ring} transition-all duration-2000 ${
            animationPhase !== 'initial' ? 'animate-spin-slow' : ''
          }`} style={{ animationDuration: '8s' }} />
          {/* Inner Glow Ring */}
          <div className={`absolute inset-2 w-28 h-28 rounded-full bg-gradient-to-br ${colors.gradient} transition-all duration-1000 ${
            animationPhase !== 'initial' ? 'animate-pulse' : ''
          }`} />
          {/* Logo Background */}
          <div className={`w-32 h-32 bg-gradient-to-br ${colors.gradient} rounded-full flex items-center justify-center shadow-2xl ${colors.accent === 'manga-accent' ? 'shadow-manga-accent/25' : ''}`}>
            
            {/* Book Icon */}
            <img
              src={logoSrc}
              alt="App Logo"
              onError={e => { e.target.onerror = null; e.target.style.display = 'none'; document.getElementById('splash-fallback').style.display = 'block'; }}
              className={`w-24 h-24 object-contain transition-all duration-700 ease-out rounded-full shadow-lg ${
                animationPhase === 'initial'
                  ? 'scale-0 rotate-45 opacity-0'
                  : 'scale-100 rotate-0 opacity-100'
              }`}
              style={{ background: colors.text === 'white' ? '#fff' : '#111827' }}
            />
            <div
              id="splash-fallback"
              style={{ display: 'none', color: colors.text === 'white' ? '#fff' : '#111827' }}
              className={`text-6xl transition-all duration-700 ease-out absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${
                animationPhase === 'initial'
                  ? 'scale-0 rotate-45 opacity-0'
                  : 'scale-100 rotate-0 opacity-100'
              }`}
            >📚</div>
            
            {/* Sparkle Effects */}
            <div className={`absolute top-2 right-6 transition-all duration-500 delay-700 ${
              animationPhase === 'logo' || animationPhase === 'text' ? 'opacity-100 animate-ping' : 'opacity-0'
            }`} style={{ color: colors.text === 'white' ? '#fff' : '#a78bfa' }}>
              ✨
            </div>
            <div className={`absolute bottom-6 left-2 transition-all duration-500 delay-1000 ${
              animationPhase === 'logo' || animationPhase === 'text' ? 'opacity-100 animate-ping' : 'opacity-0'
            }`} style={{ color: colors.text === 'white' ? '#fff' : '#a78bfa' }}>
              ⭐
            </div>
          </div>
        </div>
        
        {/* App Title */}
            <div className={`text-center z-30 transition-all duration-800 ease-out delay-300 ${
              animationPhase === 'text' || animationPhase === 'fadeOut'
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}>
          <h1 className={`text-4xl md:text-5xl font-bold mb-2 tracking-wide ${colors.text === 'white' ? 'text-white' : 'text-manga-dark'}`}>
            <span className={`bg-gradient-to-r from-white via-${colors.accent} to-white bg-clip-text text-transparent animate-gradient`}>
              Manga Reader
            </span>
          </h1>
          <p className={`${colors.text === 'white' ? 'text-white/80' : 'text-manga-dark/80'} text-lg font-medium`}>
            読書体験を向上させる
          </p>
          <p className={`${colors.text === 'white' ? 'text-white/60' : 'text-manga-dark/60'} text-sm mt-1`}>
            Enhanced Reading Experience
          </p>
        </div>
        
        {/* Loading Animation */}
        <div className={`mt-8 transition-all duration-500 delay-500 ${
          animationPhase === 'text' ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex space-x-2">
            <div className={`w-2 h-2 rounded-full animate-bounce ${colors.particle}`} style={{ animationDelay: '0ms' }}></div>
            <div className={`w-2 h-2 rounded-full animate-bounce ${colors.particle}`} style={{ animationDelay: '150ms' }}></div>
            <div className={`w-2 h-2 rounded-full animate-bounce ${colors.particle}`} style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
        
        {/* Version Badge */}
        <div className={`absolute bottom-16 left-1/2 transform -translate-x-1/2 transition-all duration-500 delay-700 ${
          animationPhase === 'text' ? 'opacity-60' : 'opacity-0'
        }`}>
          <div className={`${colors.badge} backdrop-blur-sm rounded-full px-4 py-2 border ${colors.ring}`}>
            <span className={`${colors.text === 'white' ? 'text-white/70' : 'text-manga-dark/70'} text-sm`}>v2.1.0 • PWA Ready</span>
          </div>
        </div>
      </div>
      
      {/* Floating Particles */}
      <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-1000 ${
        animationPhase !== 'initial' ? 'opacity-100' : 'opacity-0'
      }`}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 rounded-full animate-float ${colors.particle}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SplashScreen;