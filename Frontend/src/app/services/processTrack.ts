// src/services/processTrack.ts
export interface ProcessTrackResponse {
  status: string;
  track_info?: {
    title: string;
    artist: string;
  };
  analysis?: {
    key: string;
  };
  downloads?: {
    vocals_url: string;
    instrumental_url: string;
    text_url: string;
    images_count: string;
    images_url: string;
  };
}

export async function processTrack(trackId: string) {
  try {
    const response = await fetch(`/api/process-track/${trackId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('Response status:', response.status);

    const data = await response.json();
    console.log('Response data:', data);

    return data;
  } catch (err) {
    console.error('Error processing track:', err);
    return { status: 'error' };
  }
}

