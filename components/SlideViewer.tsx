import React from 'react';
import { Slide } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideViewerProps {
  slide: Slide;
  hasPrevious: boolean;
  hasNext: boolean;
  onNext: () => void;
  onPrevious: () => void;
  role: 'ADMIN' | 'GUEST';
}

export const SlideViewer: React.FC<SlideViewerProps> = ({
  slide,
  hasPrevious,
  hasNext,
  onNext,
  onPrevious,
  role
}) => {

  // Deterministic animation based on slide ID to ensure stability but variety
  const getAnimationClass = (id: string) => {
      const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const animations = [
          'animate-fade-scale', 
          'animate-slide-up', 
          'animate-soft-zoom'
      ];
      return animations[sum % animations.length];
  };

  const animationClass = getAnimationClass(slide.id);

  return (
    <div className="relative w-full h-full flex flex-col bg-gray-900 text-white overflow-hidden">
      <style>{`
        @keyframes fadeScale { 
            0% { opacity: 0; transform: scale(0.95); } 
            100% { opacity: 1; transform: scale(1); } 
        }
        @keyframes slideUp { 
            0% { opacity: 0; transform: translateY(40px); } 
            100% { opacity: 1; transform: translateY(0); } 
        }
        @keyframes softZoom { 
            0% { opacity: 0; transform: scale(1.05); } 
            100% { opacity: 1; transform: scale(1); } 
        }
        
        .animate-fade-scale { animation: fadeScale 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-slide-up { animation: slideUp 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-soft-zoom { animation: softZoom 0.9s ease-out forwards; }
      `}</style>

      {/* Dynamic Background */}
      <div 
        key={`bg-${slide.id}`}
        className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl transition-all duration-1000 transform scale-110"
        style={{ backgroundImage: `url(${slide.imageData})` }}
      />

      {/* Main Content Area - With Animation Key */}
      <div 
        key={slide.id} 
        className={`relative z-10 flex-1 flex flex-col items-center justify-center p-4 pb-24 ${animationClass}`}
      >
        
        {/* Image Container - Adaptive Size */}
        <div className="relative w-full flex-1 flex items-center justify-center min-h-0 mb-6 px-4">
            <img 
              src={slide.imageData} 
              alt={slide.title} 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl ring-1 ring-white/10 bg-black/20"
              style={{ maxHeight: '65vh' }} 
            />
        </div>

        {/* Text Content */}
        <div className="text-center space-y-3 max-w-4xl px-4 bg-black/30 backdrop-blur-sm p-5 rounded-2xl border border-white/5 mb-8">
          <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 drop-shadow-sm leading-tight" style={{ fontFamily: 'Heebo, sans-serif' }}>
            {slide.title}
          </h1>
          <p className="text-lg md:text-2xl text-gray-200 font-light max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Navigation Controls - Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-50 flex items-center justify-center gap-6 pb-4">
        
        {/* Previous Button (Functionally Previous, Visual Right in RTL -> ChevronRight) */}
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={`p-3 rounded-full backdrop-blur-md border border-white/10 transition-all duration-300 group ${
            hasPrevious 
              ? 'bg-white/10 hover:bg-white/25 text-white hover:scale-110 active:scale-95 cursor-pointer shadow-lg hover:shadow-blue-500/20' 
              : 'opacity-20 cursor-not-allowed'
          }`}
          aria-label="Previous Slide"
        >
          <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Pagination Dot / Separator */}
        <div className="flex gap-2 opacity-50">
            <div className="w-1 h-1 rounded-full bg-white"></div>
            <div className="w-1 h-1 rounded-full bg-white"></div>
            <div className="w-1 h-1 rounded-full bg-white"></div>
        </div>

        {/* Next Button (Functionally Next, Visual Left in RTL -> ChevronLeft) */}
        <button
          onClick={onNext}
          disabled={!hasNext}
          className={`p-3 rounded-full backdrop-blur-md border border-white/10 transition-all duration-300 group ${
            hasNext 
              ? 'bg-white/10 hover:bg-white/25 text-white hover:scale-110 active:scale-95 cursor-pointer shadow-lg hover:shadow-purple-500/20' 
              : 'opacity-20 cursor-not-allowed'
          }`}
          aria-label="Next Slide"
        >
          <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};