// src/constants/phrases.ts

export interface Phrase {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sightWords: readonly string[];
  phoneticPatterns?: readonly string[];
}

export const PHRASES: readonly Phrase[] = [
  {
    id: '1',
    text: "I love myself",
    difficulty: 'easy',
    sightWords: ["I", "love", "myself"],
    phoneticPatterns: ["I", "l-uh-v", "my-self"]
  },
  {
    id: '2',
    text: "The quick brown fox jumps over the lazy dog",
    difficulty: 'medium',
    sightWords: ["the", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog"],
    phoneticPatterns: ["th-uh", "kw-ih-k", "br-ow-n", "f-ah-k-s", "j-uh-m-p-s", "oh-v-er", "th-uh", "l-ay-z-ee", "d-aw-g"]
  },
  {
    id: '3',
    text: "Peter Piper picked a peck of pickled peppers",
    difficulty: 'hard',
    sightWords: ["a", "of"],
    phoneticPatterns: ["p-ee-t-er", "p-ie-p-er", "p-ih-k-t", "ay", "p-eh-k", "ah-v", "p-ih-k-l-d", "p-eh-p-er-z"]
  }
] as const;

// Utility type to extract the readonly phrase type
export type PhraseType = typeof PHRASES[number];

// ======================================
// Sight Words Master List (Phase 1 Prep)
// ======================================
export const SIGHT_WORDS = {
  easy: [
    "I", "a", "the", "and", "to", "in", "is", "it", "you", "that", 
    "he", "was", "for", "on", "are", "with", "they", "at", "be", "this"
  ],
  medium: [
    "have", "from", "or", "one", "had", "by", "word", "but", "not", "what",
    "all", "were", "we", "when", "your", "can", "said", "there", "use", "each"
  ],
  hard: [
    "which", "she", "do", "how", "their", "if", "will", "up", "other", "about",
    "out", "many", "then", "them", "these", "so", "some", "her", "would", "make"
  ]
} as const;

// ======================================
// Phonetic Patterns Master List (Phase 2)
// ======================================
export const PHONETIC_PATTERNS = {
  vowels: ["a", "e", "i", "o", "u"],
  blends: ["bl", "br", "cl", "cr", "dr", "fl", "fr", "gl", "gr", "pl", "pr", "tr"],
  digraphs: ["ch", "sh", "th", "wh", "ph", "ck", "ng"]
} as const;

/*

Project Phases Roadmap:

Phase 1: Sight Words Foundation
- Create 50+ phrases covering 100 essential sight words
- Group by difficulty (easy/medium/hard)
- Track coverage progress

Phase 2: Phonetic Development
- Expand phrases to include key phonetic patterns
- Create minimal pairs for sound discrimination
- Develop syllable counting exercises

Phase 3: Analytics Integration
- Track user progress per sight word
- Identify problematic phonetic patterns
- Time response metrics

Phase 4: Gamification
- Create word-building games
- Develop pronunciation challenges
- Implement progress rewards

*/