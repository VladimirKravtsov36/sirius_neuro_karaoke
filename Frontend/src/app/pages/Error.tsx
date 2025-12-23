import { useNavigate } from 'react-router-dom';
import { SearchWidget } from '../components/SearchWidget';
import { KaraokeSubtitles } from '../components/KaraokeSubtitles';

export default function ErrorPage() {
  const navigate = useNavigate();

  return (
    <main className="flex-1 px-4 sm:px-8 lg:px-16 pb-4 sm:pb-8 lg:pb-16 flex flex-col lg:flex-row items-center gap-6 sm:gap-8 lg:gap-16 h-screen overflow-hidden bg-[#0B0B0F] text-white">

      {/* Left column */}
      <div className="w-full lg:flex-1 space-y-4 sm:space-y-6 lg:space-y-8 flex flex-col justify-center">
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-tight">
            Something went wrong
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-xl">
            Please try again)
          </p>
        </div>

        <div className="pt-2 sm:pt-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 rounded-lg font-medium text-black"
          >
            На главную
          </button>
        </div>
      </div>

      {/* Right column */}
      <div className="w-full lg:flex-1 h-64 sm:h-80 md:h-96 lg:h-full lg:max-h-[600px] flex items-center justify-center">
        <KaraokeSubtitles />
      </div>

    </main>
  );
}
