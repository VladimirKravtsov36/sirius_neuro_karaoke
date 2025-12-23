import { Mic2 } from 'lucide-react';

export function KaraokeHeader() {
  return (
    <header className="flex items-center justify-between px-4 sm:px-8 lg:px-16 pt-4 sm:pt-6 lg:pt-8 pb-3 sm:pb-4 lg:pb-6">
      {/* Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
          <Mic2 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
        </div>
        <span className="text-xl sm:text-2xl text-white">NeuroKaraoke</span>
      </div>
    </header>
  );
}