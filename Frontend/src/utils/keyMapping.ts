// src/utils/keyMapping.ts

// Пример списка нот, начиная с C (может быть расширен)
export const KEY_NOTES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
  "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"
];

// Маппинг ноты в полутона относительно C (без минора/мажора)
// C = 0, C# = 1, D = 2, ..., B = 11
// Для миноров добавим смещение, например, -1 (это условно, можно по-другому)
const MAJOR_SEMITONES: { [key: string]: number } = {
  "C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11
};

const MINOR_SEMITONES: { [key: string]: number } = {
  "Cm": 0, "C#m": 1, "Dm": 2, "D#m": 3, "Em": 4, "Fm": 5, "F#m": 6, "Gm": 7, "G#m": 8, "Am": 9, "A#m": 10, "Bm": 11
};

// Функция для получения количества полутона из строки ноты
export const getKeySemitones = (key: string): number => {
  if (MAJOR_SEMITONES.hasOwnProperty(key)) {
    return MAJOR_SEMITONES[key];
  }
  if (MINOR_SEMITONES.hasOwnProperty(key)) {
    // Для минора можно добавить смещение, например -1 или -3, в зависимости от контекста.
    // Пока оставим как есть, если минор равен мажору по тонике.
    // Или можно вычесть 3: return MINOR_SEMITONES[key] - 3;
    // Или просто вернуть как есть: return MINOR_SEMITONES[key];
    // Выберем вариант: минор = мажор - 3 полутона (например, A минор = C мажор - 3, но A минор = F мажор - 4 и т.д.)
    // Для простоты, будем считать, что минор = мажор - 3, если тоника совпадает.
    // Это условно. Более точная логика зависит от контекста.
    // Пусть для A -> Am будет -3, B -> Bm будет -3 и т.д.
    // C -> Cm -> -3, D -> Dm -> -3 ...
    // A -> Am -> A - 3 = F#, но A минор по тонике обычно считается от C мажор -> A - 3 = F#, или от F мажор -> A - 4 = E#.
    // Обычно относительный минор = мажор - 3 (например, C мажор <-> A минор).
    // Поэтому, если нота минорная, мы можем вернуть мажорную - 3.
    const majorKey = key.slice(0, -1); // Убираем 'm'
    if (MAJOR_SEMITONES.hasOwnProperty(majorKey)) {
      return MAJOR_SEMITONES[majorKey] - 3;
    }
    // Если мажор не найден, возвращаем как есть.
    return MINOR_SEMITONES[key];
  }
  // Если нота не найдена, возвращаем 0
  console.warn(`Song.tsx: Неизвестная нота: ${key}, возвращаем 0`);
  return 0;
};

// Функция для получения индекса ноты в списке KEY_NOTES
export const getKeyIndex = (key: string): number => {
  const index = KEY_NOTES.indexOf(key);
  if (index === -1) {
    console.warn(`Song.tsx: Нота ${key} не найдена в списке KEY_NOTES, возвращаем 0`);
    return 0;
  }
  return index;
};

// Функция для получения ноты по индексу
export const getKeyByIndex = (index: number): string => {
  if (index < 0 || index >= KEY_NOTES.length) {
    console.warn(`Song.tsx: Индекс ${index} вне диапазона KEY_NOTES, возвращаем 'C'`);
    return KEY_NOTES[0];
  }
  return KEY_NOTES[index];
};

// --- Добавлена функция ---
export const semitonesToPitchFactor = (semitones: number): number => {
  return Math.pow(2, semitones / 12);
};