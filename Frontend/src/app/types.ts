export interface AnimationParams {
  ballBounceHeight: number;
  ballBounceDuration: number;
  ballRhythmOffset: number;
  fillAnimationSpeed: number;
  wordLingerDuration: number;
  fadeOutDuration: number;
  particleIntensity: number;
  particleCount: number;
}

export interface Word {
  word: string;
  start: number;
  end: number;
  score: number;
}

export interface KaraokeLine {
  start: number;
  end: number;
  text: string;
  words: Word[];
}
