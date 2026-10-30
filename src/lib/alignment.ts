export interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

/**
 * Phoneme duration weighting dictionary.
 * Consonants and vowels have realistic duration weights.
 */
const CHAR_WEIGHTS: Record<string, number> = {
  a: 1.25, e: 1.15, i: 1.05, o: 1.30, u: 1.20,
  b: 0.85, c: 0.90, d: 0.80, f: 1.05, g: 0.85,
  h: 0.70, j: 0.95, k: 0.85, l: 1.10, m: 1.20,
  n: 1.10, p: 0.75, q: 0.90, r: 1.15, s: 1.30,
  t: 0.75, v: 1.00, w: 1.10, x: 1.10, y: 1.10, z: 1.25,
  " ": 0.65, ",": 2.20, ".": 3.50, "!": 3.20, "?": 3.40, ";": 2.50, ":": 2.20, "-": 1.50
};

export function generateAlignment(text: string, totalDuration: number): Alignment {
  const chars = Array.from(text);
  if (chars.length === 0) {
    return {
      characters: [],
      character_start_times_seconds: [],
      character_end_times_seconds: []
    };
  }

  const weights = chars.map(c => CHAR_WEIGHTS[c.toLowerCase()] || 1.0);
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  const scale = totalDuration / Math.max(0.001, totalWeight);

  const startTimes: number[] = [];
  const endTimes: number[] = [];
  let currentTime = 0.0;

  for (let i = 0; i < chars.length; i++) {
    const dur = weights[i] * scale;
    startTimes.push(parseFloat(currentTime.toFixed(3)));
    currentTime += dur;
    endTimes.push(parseFloat(currentTime.toFixed(3)));
  }

  return {
    characters: chars,
    character_start_times_seconds: startTimes,
    character_end_times_seconds: endTimes
  };
}

export function extractWordTimestamps(alignment: Alignment): WordTimestamp[] {
  const words: WordTimestamp[] = [];
  let currentWord = "";
  let wordStart = 0;
  let wordEnd = 0;

  for (let i = 0; i < alignment.characters.length; i++) {
    const char = alignment.characters[i];
    const start = alignment.character_start_times_seconds[i];
    const end = alignment.character_end_times_seconds[i];

    if (/\s|[.,!?;:]/.test(char)) {
      if (currentWord.trim()) {
        words.push({ word: currentWord.trim(), start: wordStart, end: wordEnd });
        currentWord = "";
      }
    } else {
      if (!currentWord) {
        wordStart = start;
      }
      currentWord += char;
      wordEnd = end;
    }
  }

  if (currentWord.trim()) {
    words.push({ word: currentWord.trim(), start: wordStart, end: wordEnd });
  }

  return words;
}
