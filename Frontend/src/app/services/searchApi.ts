export type SearchResult = {
  id: string;
  title: string;
  artist: string;
};

export async function searchSongs(
  query: string,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
    signal,
  });

  if (!res.ok) {
    throw new Error('Search failed');
  }

  return res.json();
}
