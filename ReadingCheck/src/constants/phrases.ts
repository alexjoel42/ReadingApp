// src/constants/phrases.ts

export interface Phrase {
  id: string;
  text: string;
  sightWords: readonly string[];
  phoneticPatterns?: readonly string[];
}

export const PHRASES: readonly Phrase[] = [
  {
    id: 'phrase-1',
    text: "I love myself",
    sightWords: ["I", "love", "myself"],
    phoneticPatterns: ["I", "l-uh-v", "my-self"]
  },
  {
    id: 'phrase-2',
    text: "The quick brown fox jumps over the lazy dog",
    sightWords: ["the", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog"],
    phoneticPatterns: ["th-uh", "kw-ih-k", "br-ow-n", "f-ah-k-s", "j-uh-m-p-s", "oh-v-er", "th-uh", "l-ay-z-ee", "d-aw-g"]
  },
  {
    id: 'phrase-3',
    text: "Peter Piper picked a peck of pickled peppers",
    sightWords: ["a", "of"],
    phoneticPatterns: ["p-ee-t-er", "p-ie-p-er", "p-ih-k-t", "ay", "p-eh-k", "ah-v", "p-ih-k-l-d", "p-eh-p-er-z"]
  }
] as const;

// Utility type to extract phrase type
export type PhraseType = typeof PHRASES[number];

// ======================================
// Sight Words Master List
// ======================================
export const SIGHT_WORDS = [
  "I", "a", "the", "and", "to", "in", "is", "it", "you", "that",
  "he", "was", "for", "on", "are", "with", "they", "at", "be", "this",
  "have", "from", "or", "one", "had", "by", "word", "but", "not", "what",
  "all", "were", "we", "when", "your", "can", "said", "there", "use", "each",
  "which", "she", "do", "how", "their", "if", "will", "up", "other", "about",
  "out", "many", "then", "them", "these", "so", "some", "her", "would", "make"
] as const;

export type SightWord = typeof SIGHT_WORDS[number];

// ======================================
// Phonetic Patterns Master List
// ======================================
export const PHONETIC_PATTERNS = {
  vowels: ["a", "e", "i", "o", "u"] as const,
  consonantBlends: ["bl", "br", "cl", "cr", "dr", "fl", "fr", "gl", "gr", "pl", "pr", "tr"] as const,
  digraphs: ["ch", "sh", "th", "wh", "ph", "ck", "ng"] as const,
  diphthongs: ["oi", "oy", "ou", "ow", "au", "aw", "oo"] as const
} as const;

export type PhoneticPattern = 
  | typeof PHONETIC_PATTERNS.vowels[number]
  | typeof PHONETIC_PATTERNS.consonantBlends[number]
  | typeof PHONETIC_PATTERNS.digraphs[number]
  | typeof PHONETIC_PATTERNS.diphthongs[number];

// ======================================
// Utility Functions
// ======================================
export function getPhraseById(id: string): Phrase | undefined {
  return PHRASES.find(phrase => phrase.id === id);
}

export function getRandomPhrase(): Phrase {
  return PHRASES[Math.floor(Math.random() * PHRASES.length)];
}