import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { processTrack } from '../services/processTrack';

interface TrackCardProps {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
}

export function TrackCard({ id, title, artist, coverUrl }: TrackCardProps) {
  const navigate = useNavigate();

  const handleClick = async () => {
    const result = await processTrack(id);

    if (result.status === 'success') {
      navigate('/song', { state: { trackData: result } });
    } else {
      navigate('/error');
    }
  };

  return (
    <div
      key={id}
      onClick={handleClick}
      className="flex items-center justify-between gap-3 p-4 rounded-xl bg-[#1A1A24] hover:bg-[#222230] border border-gray-800 transition cursor-pointer"
    >
      <div className="flex items-center gap-3">
        {coverUrl && (
          <img
            src={coverUrl}
            alt={title}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover"
          />
        )}
        <div className="flex flex-col">
          <span className="font-medium text-white">{title}</span>
          <span className="text-sm text-gray-400">{artist}</span>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </div>
  );
}
