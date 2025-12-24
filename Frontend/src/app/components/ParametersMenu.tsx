import { motion, AnimatePresence } from 'motion/react';
import { Slider } from './ui/slider';
import { ChevronLeft, SlidersHorizontal as Sliders } from 'lucide-react';

interface ParametersMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  mixValue: number;
  keyValue: number;
  onMixChange: (value: number) => void;
  onKeyChange: (value: number) => void;
}

export function ParametersMenu({
  isOpen,
  onToggle,
  mixValue,
  keyValue,
  onMixChange,
  onKeyChange,
}: ParametersMenuProps) {
  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-3 rounded-full bg-gray-800/80 backdrop-blur-sm border border-gray-700 hover:bg-gray-700/80 transition-all duration-300 shadow-lg hover:shadow-purple-500/20"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sliders className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Menu panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-gradient-to-br from-gray-900/95 to-gray-950/95 backdrop-blur-xl border-r border-gray-800 z-40 shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Sliders className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="font-semibold">Parameters</h2>
              </div>
            </div>

            {/* Controls */}
            <div className="p-6 space-y-8">
              {/* Mix Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-400">Mix</label>
                  <div className="px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30">
                    <span className="font-semibold text-purple-300">{mixValue}%</span>
                  </div>
                </div>
                <Slider
                  value={[mixValue]}
                  onValueChange={(values) => onMixChange(values[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Instrumental</span>
                  <span>Vocals</span>
                </div>
              </div>

              {/* Key Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-400">Key</label>
                  <div className="px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30">
                    <span className="font-semibold text-blue-300">
                      {keyValue > 0 ? '+' : ''}{keyValue}
                    </span>
                  </div>
                </div>
                <Slider
                  value={[keyValue]}
                  onValueChange={(values) => onKeyChange(values[0])}
                  min={-6}
                  max={6}
                  step={1}
                  className="w-full [direction:rtl]]"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>-6</span>
                  <span>0</span>
                  <span>+6</span>
                </div>
              </div>
            </div>

            {/* Decorative glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}