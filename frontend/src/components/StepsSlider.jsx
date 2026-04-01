import React, { useState, useEffect } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

const slides = [
  {
    image: "https://images.unsplash.com/photo-1556155092-490a1ba16284?w=800&h=600&fit=crop",
    label: "01 — Zadání zakázky",
  },
  {
    image: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=800&h=600&fit=crop",
    label: "02 — Přijetí zakázky",
  },
  {
    image: "https://images.pexels.com/photos/6790070/pexels-photo-6790070.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    label: "03 — Realizace",
  },
  {
    image: "https://images.pexels.com/photos/8961300/pexels-photo-8961300.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    label: "04 — Předání díla",
  },
  {
    image: "https://images.unsplash.com/photo-1633613286991-611fe299c4be?w=800&h=600&fit=crop",
    label: "05 — Hodnocení",
  },
];

const StepsSlider = ({ activeStep }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (activeStep !== null && activeStep !== undefined) {
      setCurrentSlide(activeStep);
      setIsAutoPlaying(false);
    }
  }, [activeStep]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl group" data-testid="steps-slider">
      <div className="relative w-full" style={{ paddingBottom: '75%' }}>
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.label}
              className="w-full h-full object-cover"
              data-testid={`steps-slide-${index}`}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <span className="text-white font-semibold text-sm tracking-wide">
                {slide.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={goToPrevious}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        aria-label="Předchozí"
        data-testid="steps-slider-prev"
      >
        <CaretLeft weight="bold" className="w-5 h-5 text-gray-800" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        aria-label="Další"
        data-testid="steps-slider-next"
      >
        <CaretRight weight="bold" className="w-5 h-5 text-gray-800" />
      </button>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentSlide(index);
              setIsAutoPlaying(false);
              setTimeout(() => setIsAutoPlaying(true), 10000);
            }}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
              index === currentSlide
                ? 'bg-orange-500 w-6'
                : 'bg-white/60 hover:bg-white/80'
            }`}
            aria-label={`Krok ${index + 1}`}
            data-testid={`steps-dot-${index}`}
          />
        ))}
      </div>
    </div>
  );
};

export default StepsSlider;
