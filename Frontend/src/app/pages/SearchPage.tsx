import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchWidget } from '../components/SearchWidget';
import { searchSongs, SearchResult } from '../services/searchApi';
import { TrackCard } from '../components/TrackCard';

export default function SearchPage() {
  const [params] = useSearchParams();
  const initialQuery = params.get('q') ?? '';

  // состояние для live search
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // debounce: обновляем debouncedQuery через 400ms после последнего ввода
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);

    return () => clearTimeout(handler);
  }, [query]);

  // запрос к backend при изменении debouncedQuery
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    searchSongs(debouncedQuery, controller.signal)
      .then(setResults)
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError('Something went wrong');
          setResults([]);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <main className="flex-1 px-4 sm:px-8 lg:px-16 pb-4 sm:pb-8">
      {/* Поисковая строка сверху, sticky */}
      <div className="sticky top-0 bg-[#0B0B0F] py-4 z-10">
        <SearchWidget
          initialValue={initialQuery}
          onChangeLive={setQuery} // live search с debounce
        />
      </div>

      {/* Результаты */}
      <div className="mt-6 grid grid-cols-1 gap-4">
        {loading && <p className="text-gray-400 col-span-full">Searching…</p>}

        {error && <p className="text-red-400 col-span-full">{error}</p>}

        {!loading && !error && results.length === 0 && debouncedQuery && (
          <p className="text-gray-500 col-span-full">Nothing found</p>
        )}

        {!loading &&
          !error &&
          results.map((item) => (
            <TrackCard
              key={item.id}
              id={item.id}
              title={item.title}
              artist={item.artist}
              coverUrl={item.coverUrl}
            />
          ))}
      </div>
    </main>
  );
}
