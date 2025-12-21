import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Props = {
  initialValue?: string;
  onChangeLive?: (value: string) => void; // для live search
};

export function SearchWidget({ initialValue = '', onChangeLive }: Props) {
  const [value, setValue] = useState(initialValue);
  const navigate = useNavigate();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  function submit() {
    const q = value.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (onChangeLive) {
      onChangeLive(e.target.value); // вызываем live search, если задано
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-3"
    >
      <div className="relative">
        <div className="flex items-center bg-[#1A1A24] border border-gray-800 rounded-2xl overflow-hidden focus-within:border-yellow-500 transition">
          <div className="pl-5 pr-4">
            <Search className="w-5 h-5 text-gray-500" />
          </div>

          <input
            value={value}
            onChange={handleChange}
            placeholder="Search songs…"
            className="flex-1 bg-transparent text-white placeholder:text-gray-500 py-5 pr-6 outline-none text-lg"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 pl-2">
        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        Powered by AI vocal alignment
      </div>
    </form>
  );
}
