import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface RotatingSlideshowProps {
  images: string[];
  duration?: number;
}

const SlideIndicator = memo(({ index, currentIndex }: { index: number; currentIndex: number }) => (
  <motion.div
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
));

SlideIndicator.displayName = 'SlideIndicator';

export function RotatingSlideshow({ images, duration = 3 }: RotatingSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNextSlide = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(goToNextSlide, duration * 1000);

    return () => clearInterval(interval);
  }, [images.length, duration, goToNextSlide]);

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center w-full aspect-video bg-gray-800"> {/* Добавлен класс для соотношения сторон */}
        <p className="text-gray-400">No images available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video flex items-center justify-center overflow-hidden bg-black/20 backdrop-blur-sm"> {/* Изменен контейнер на 16:9 */}
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
              duration: 0.3,
              ease: [0.43, 0.13, 0.23, 0.96],
            }}
            className="absolute inset-0"
          >
            <img
              src={images[currentIndex]}
              alt={`Slide ${currentIndex + 1}`}
              className="w-full h-full object-cover object-center" // Убедитесь, что изображение заполняет контейнер
            />
            
            {/* Subtle overlay gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none"></div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide indicator dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {images.map((_, index) => (
          <SlideIndicator
            key={index}
            index={index}
            currentIndex={currentIndex}
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