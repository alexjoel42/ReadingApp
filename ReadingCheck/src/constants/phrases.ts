// src/constants/phrases.ts

// Organized by phonetic progression
export const PHRASE_SETS = [
  // Set 1: CVC Words + Basic Sight Words
  {
    id: 'set-1',
    focus: "CVC Words & Basic Sight Words",
    phrases: [
      { id: 'p1-1', text: "I am strong", sightWords: ["I", "am"], phoneticPatterns: ["I", "a-m", "s-t-r-aw-ng"] },
      { id: 'p1-2', text: "We can win", sightWords: ["we", "can"], phoneticPatterns: ["w-ee", "k-ah-n", "w-ih-n"] },
      { id: 'p1-3', text: "You are kind", sightWords: ["you", "are"], phoneticPatterns: ["y-oo", "ar", "k-ie-n-d"] },
      { id: 'p1-4', text: "My joy grows", sightWords: ["my"], phoneticPatterns: ["m-y", "j-oi", "g-r-ow-s"] },
      { id: 'p1-5', text: "Be your best", sightWords: ["be", "your"], phoneticPatterns: ["b-ee", "y-or", "b-eh-s-t"] },
      { id: 'p1-6', text: "Love yourself", sightWords: ["love"], phoneticPatterns: ["l-uh-v", "y-or-s-eh-l-f"] },
      { id: 'p1-7', text: "We help others", sightWords: ["we"], phoneticPatterns: ["w-ee", "h-eh-l-p", "uh-th-er-z"] },
      { id: 'p1-8', text: "Try new things", sightWords: ["try"], phoneticPatterns: ["t-r-ie", "n-oo", "th-ih-ng-z"] },
      { id: 'p1-9', text: "Dream big dreams", sightWords: ["dream"], phoneticPatterns: ["d-r-ee-m", "b-ih-g", "d-r-ee-m-z"] },
      { id: 'p1-10', text: "Hope shines bright", sightWords: ["hope"], phoneticPatterns: ["h-ow-p", "sh-ie-n-z", "b-r-ie-t"] }
    ]
  },
  // Set 2: Digraphs/Blends + Expanded Vocabulary
  {
    id: 'set-2',
    focus: "Digraphs & Blends",
    phrases: [
      { id: 'p2-1', text: "Share with friends", sightWords: ["share", "with"], phoneticPatterns: ["sh-air", "w-ih-th", "f-r-eh-n-d-z"] },
      { id: 'p2-2', text: "Think happy thoughts", sightWords: ["think"], phoneticPatterns: ["th-ih-ng-k", "h-ae-p-ee", "th-aw-t-s"] },
      { id: 'p2-3', text: "When the sun shines", sightWords: ["when", "the"], phoneticPatterns: ["w-eh-n", "th-ee", "s-uh-n", "sh-ie-n-z"] },
      { id: 'p2-4', text: "Which path to choose", sightWords: ["which", "to"], phoneticPatterns: ["w-ih-ch", "p-ae-th", "t-oo", "ch-oo-z"] },
      { id: 'p2-5', text: "Through thick and thin", sightWords: ["and"], phoneticPatterns: ["th-r-oo", "th-ih-k", "ae-n-d", "th-ih-n"] }
    ]
  },
  // Add more sets as needed...
] as const;

export type PhraseSet = typeof PHRASE_SETS[number];
export type Phrase = PhraseSet['phrases'][number];

