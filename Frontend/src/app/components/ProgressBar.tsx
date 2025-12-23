import { motion } from 'motion/react';
import { Play, Pause } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProgressBarProps {
  currentTime: number;
  totalDuration: number;
  onSeek: (time: number) => void;
}

export function ProgressBar({ currentTime, totalDuration, onSeek }: ProgressBarProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [localTime, setLocalTime] = useState(currentTime);

  useEffect(() => {
    if (!isDragging) {
      setLocalTime(currentTime);
    }
  }, [currentTime, isDragging]);

  // Auto-increment time for demo
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      onSeek((prev) => {
        const next = prev + 0.1;
        return next >= totalDuration ? 0 : next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, totalDuration, onSeek]);

  const progress = (localTime / totalDuration) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * totalDuration;
    onSeek(newTime);
    setLocalTime(newTime);
  };

  return (
    <div className="relative bg-gradient-to-t from-black/80 to-transparent backdrop-blur-lg border-t border-gray-800/50">
      {/* Glow effect */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
      
      <div className="px-6 py-4 space-y-3">
        {/* Progress bar */}
        <div
          className="relative h-2 bg-gray-800 rounded-full cursor-pointer group"
          onClick={handleProgressClick}
        >
          {/* Background glow */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-4 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-md transition-all"
            style={{ width: `${progress}%` }}
          ></div>

          {/* Progress fill */}
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-400 rounded-full shadow-lg shadow-purple-500/50"
            style={{ width: `${progress}%` }}
            initial={false}
          >
            {/* Moving shimmer effect */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '200%']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            </div>
          </motion.div>

          {/* Playhead */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg shadow-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 8px)` }}
          />
        </div>

        {/* Time and controls */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {/* Play/Pause button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-full bg-purple-500 hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" fill="currentColor" />
              ) : (
                <Play className="w-4 h-4" fill="currentColor" />
              )}
            </button>

            {/* Current time */}
            <span className="font-mono text-gray-400 tabular-nums">
              {formatTime(localTime)}
            </span>
          </div>

          {/* Total duration */}
          <span className="font-mono text-gray-500 tabular-nums">
            {formatTime(totalDuration)}
          </span>
        </div>
      </div>
    </div>
  );
}
