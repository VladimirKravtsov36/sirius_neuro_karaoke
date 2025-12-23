import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface RotatingSlideshowProps {
  images: string[];
  duration?: number; // Duration in seconds per slide
}

export function RotatingSlideshow({ images, duration = 3 }: RotatingSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, duration * 1000);

    return () => clearInterval(interval);
  }, [images.length, duration]);

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-gray-400">No images available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black/20 backdrop-blur-sm">
      {/* Slide container */}
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            initial={{
              opacity: 0,
              x: 300,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -300,
            }}
            transition={{
              duration: 0.8,
              ease: [0.43, 0.13, 0.23, 0.96], // Custom smooth ease-in-out
            }}
            className="absolute inset-0"
          >
            <img
              src={images[currentIndex]}
              alt={`Slide ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Subtle overlay gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none"></div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide indicator dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {images.map((_, index) => (
          <motion.div
            key={index}
            className={`rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white w-8 h-2'
                : 'bg-white/40 w-2 h-2'
            }`}
            initial={false}
            animate={{
              scale: index === currentIndex ? 1 : 0.8,
            }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute top-6 right-6 z-10">
        <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
          <span className="text-sm font-medium text-white/90">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      </div>
    </div>
  );
}