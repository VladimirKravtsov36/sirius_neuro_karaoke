export type SearchResult = {
  id: string;
  title: string;
  artist: string;
};

export async function searchSongs(
  query: string,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  const res = await fetch(`/search?q=${encodeURIComponent(query)}`, {
    signal,
  });

  if (!res.ok) {
    throw new Error('Search failed');
  }

  const data = await res.json(); // Await the JSON response first
  return data.items.tracks; // Then access the nested property
}