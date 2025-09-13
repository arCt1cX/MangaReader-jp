import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [animationPhase, setAnimationPhase] = useState('initial'); // initial -> logo -> text -> fadeOut
  
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
    <div className={`fixed inset-0 z-[9999] bg-gradient-to-br from-manga-dark via-manga-gray to-manga-dark flex flex-col items-center justify-center transition-opacity duration-600 ${
      animationPhase === 'fadeOut' ? 'opacity-0' : 'opacity-100'
    }`}>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 70%),
                           radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 70%)`
        }} />
      </div>
      
      {/* Main Logo Container */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Logo Circle with Book Icon */}
        <div className={`relative mb-8 transition-all duration-1000 ease-out ${
          animationPhase === 'initial' 
            ? 'scale-0 rotate-180 opacity-0' 
            : animationPhase === 'logo'
            ? 'scale-100 rotate-0 opacity-100'
            : 'scale-110 rotate-0 opacity-100'
        }`}>
          
          {/* Animated Ring */}
          <div className={`absolute inset-0 w-32 h-32 rounded-full border-4 border-manga-accent/30 transition-all duration-2000 ${
            animationPhase !== 'initial' ? 'animate-spin-slow' : ''
          }`} style={{ animationDuration: '8s' }} />
          
          {/* Inner Glow Ring */}
          <div className={`absolute inset-2 w-28 h-28 rounded-full bg-gradient-to-br from-manga-accent/20 to-transparent transition-all duration-1000 ${
            animationPhase !== 'initial' ? 'animate-pulse' : ''
          }`} />
          
          {/* Logo Background */}
          <div className="w-32 h-32 bg-gradient-to-br from-manga-accent to-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-manga-accent/25">
            
            {/* Book Icon */}
            <div className={`text-6xl transition-all duration-700 ease-out ${
              animationPhase === 'initial' 
                ? 'scale-0 rotate-45' 
                : 'scale-100 rotate-0'
            }`}>
              📚
            </div>
            
            {/* Sparkle Effects */}
            <div className={`absolute top-2 right-6 text-white/60 transition-all duration-500 delay-700 ${
              animationPhase === 'logo' || animationPhase === 'text' ? 'opacity-100 animate-ping' : 'opacity-0'
            }`}>
              ✨
            </div>
            <div className={`absolute bottom-6 left-2 text-white/40 transition-all duration-500 delay-1000 ${
              animationPhase === 'logo' || animationPhase === 'text' ? 'opacity-100 animate-ping' : 'opacity-0'
            }`}>
              ⭐
            </div>
          </div>
        </div>
        
        {/* App Title */}
        <div className={`text-center transition-all duration-800 ease-out delay-300 ${
          animationPhase === 'text' || animationPhase === 'fadeOut'
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-wide">
            <span className="bg-gradient-to-r from-white via-manga-accent to-white bg-clip-text text-transparent animate-gradient">
              Manga Reader
            </span>
          </h1>
          <p className="text-manga-text/80 text-lg font-medium">
            読書体験を向上させる
          </p>
          <p className="text-manga-text/60 text-sm mt-1">
            Enhanced Reading Experience
          </p>
        </div>
        
        {/* Loading Animation */}
        <div className={`mt-8 transition-all duration-500 delay-500 ${
          animationPhase === 'text' ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-manga-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-manga-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-manga-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
        
        {/* Version Badge */}
        <div className={`absolute bottom-16 left-1/2 transform -translate-x-1/2 transition-all duration-500 delay-700 ${
          animationPhase === 'text' ? 'opacity-60' : 'opacity-0'
        }`}>
          <div className="bg-manga-gray/50 backdrop-blur-sm rounded-full px-4 py-2 border border-manga-accent/20">
            <span className="text-manga-text/70 text-sm">v2.1.0 • PWA Ready</span>
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
            className="absolute w-1 h-1 bg-manga-accent/30 rounded-full animate-float"
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