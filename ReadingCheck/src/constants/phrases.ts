// src/constants/phrases.ts
// wholesome, affirmational phrases mapped to K-2 phonics buckets
export type Phrase = {
  id: string;
  text: string;
  sightWords: string[];
  phoneticPatterns: string[]; // O-G breakdown
};

export type PhraseSet = {
  id: string;
  focus: string;
  phrases: Phrase[];
};

// ---------- Kindergarten ----------
const kPhrases: Phrase[] = [
  { id: 'k01', text: "I am kind",             sightWords: ["I", "am"],           phoneticPatterns: ["ī", "ă-m", "k-ī-n-d"] },
  { id: 'k02', text: "We can hug",            sightWords: ["we", "can"],         phoneticPatterns: ["w-ē", "k-ă-n", "h-ŭ-g"] },
  { id: 'k03', text: "A big red dog",         sightWords: ["a", "big"],          phoneticPatterns: ["ă", "b-ĭ-g", "r-ĕ-d", "d-ŏ-g"] },
  { id: 'k04', text: "The sun is up",         sightWords: ["the", "is"],         phoneticPatterns: ["th-ē", "s-ŭ-n", "ĭ-z", "ŭ-p"] },
  { id: 'k05', text: "Let us sing",           sightWords: ["let", "us"],         phoneticPatterns: ["l-ĕ-t", "ŭ-s", "s-ĭ-ng"] },
  { id: 'k06', text: "I see the ship",        sightWords: ["I", "see", "the"],   phoneticPatterns: ["ī", "s-ē", "th-ē", "sh-ĭ-p"] },
  { id: 'k07', text: "She has a cat",        sightWords: ["she", "has", "a"],   phoneticPatterns: ["sh-ē", "h-ă-z", "ă", "c-ă-t"] },
  { id: 'k08', text: "Pick up the rock",      sightWords: ["pick", "up", "the"], phoneticPatterns: ["p-ĭ-ck", "ŭ-p", "th-ē", "r-ŏ-ck"] },
  { id: 'k09', text: "Stop and help",         sightWords: ["stop", "and", "help"], phoneticPatterns: ["s-t-ŏ-p", "ă-n-d", "h-ĕ-lp"] },
  { id: 'k10', text: "Plan a kind act",       sightWords: ["plan", "a", "kind"], phoneticPatterns: ["p-l-ă-n", "ă", "k-ī-n-d", "ă-ct"] },
];

// ---------- Grade 1 ----------
const g1Phrases: Phrase[] = [
  { id: 'g101', text: "Make a safe space",          sightWords: ["make", "a"],        phoneticPatterns: ["m-ā-k", "ă", "s-ā-f", "sp-ā-ce"] },
  { id: 'g102', text: "Ride the nice wave",         sightWords: ["ride", "the"],      phoneticPatterns: ["r-ī-d", "th-ē", "n-ī-s", "w-ā-v"] },
  { id: 'g103', text: "Hope grows inside",          sightWords: ["hope", "grows"],    phoneticPatterns: ["h-ō-p", "gr-ō-z", "ĭ-n-s-ī-d"] },
  { id: 'g104', text: "Use your wise mind",         sightWords: ["use", "your"],      phoneticPatterns: ["y-oo-z", "y-or", "w-ī-z", "m-ī-n-d"] },
  { id: 'g105', text: "Share your kind heart",      sightWords: ["share", "your"],    phoneticPatterns: ["sh-air", "y-or", "k-ī-n-d", "h-ar-t"] },
  { id: 'g106', text: "The star lights our path",   sightWords: ["the", "our"],       phoneticPatterns: ["th-ē", "st-ar", "l-ī-t-s", "ow-r", "p-ă-th"] },
  { id: 'g107', text: "Her smile warms the room",   sightWords: ["her", "the"],       phoneticPatterns: ["h-er", "sm-ī-l", "w-or-m-z", "th-ē", "r-oo-m"] },
  { id: 'g108', text: "Turn the page and learn",    sightWords: ["turn", "the", "and"], phoneticPatterns: ["t-er-n", "th-ē", "p-ā-j", "ă-n-d", "l-er-n"] },
  { id: 'g109', text: "Keep your dreams alive",     sightWords: ["keep", "your"],     phoneticPatterns: ["k-ē-p", "y-or", "dr-ē-m-z", "ă-l-ī-v"] },
  { id: 'g110', text: "We rise when we fall",       sightWords: ["we", "when"],       phoneticPatterns: ["w-ē", "r-ī-z", "w-eh-n", "w-ē", "f-aw-l"] },
];

// ---------- Grade 2 ----------
const g2Phrases: Phrase[] = [
  { id: 'g201', text: "Our joy will never end",         sightWords: ["our", "will", "never"],  phoneticPatterns: ["ow-r", "j-oi", "w-ih-l", "n-eh-v-er", "e-n-d"] },
  { id: 'g202', text: "Clouds float above the town",    sightWords: ["above", "the"],            phoneticPatterns: ["cl-ow-d-z", "fl-ō-t", "ă-b-uh-v", "th-ē", "t-ow-n"] },
  { id: 'g203', text: "The moon glows for us all",      sightWords: ["for", "us", "all"],        phoneticPatterns: ["th-ē", "m-oo-n", "gl-ō-z", "f-or", "ŭ-s", "aw-l"] },
  { id: 'g204', text: "Few things feel better",         sightWords: ["few", "things"],           phoneticPatterns: ["f-ew", "th-ih-ng-z", "f-ē-l", "b-eh-t-er"] },
  { id: 'g205', text: "Draw the best picture",          sightWords: ["draw", "the", "best"],     phoneticPatterns: ["dr-aw", "th-ē", "b-eh-s-t", "p-ih-k-ch-er"] },
  { id: 'g206', text: "We painted joyful scenes",       sightWords: ["we", "joyful"],            phoneticPatterns: ["w-ē", "p-ā-n-t-e-d", "j-oi-f-uh-l", "s-ē-n-z"] },
  { id: 'g207', text: "Running toward our dreams",      sightWords: ["toward", "our"],           phoneticPatterns: ["r-uh-n-ih-ng", "t-or-d", "ow-r", "dr-ē-m-z"] },
  { id: 'g208', text: "Sunset brings warm light",       sightWords: ["brings"],                  phoneticPatterns: ["s-uh-n-s-eh-t", "br-ih-ng-z", "w-or-m", "l-ī-t"] },
  { id: 'g209', text: "Inside every storm is calm",     sightWords: ["every", "storm"],          phoneticPatterns: ["ĭ-n-s-ī-d", "e-v-er-ē", "st-or-m", "ĭ-z", "k-ah-m"] },
  { id: 'g210', text: "We learn and grow stronger",     sightWords: ["learn", "and"],            phoneticPatterns: ["w-ē", "l-er-n", "ă-n-d", "gr-ō", "str-or-ng-er"] },
];

// ---------- export to app ----------
export const PHRASE_SETS = [
  { id: 'k-set',  focus: 'Kindergarten – CVC & Friends', phrases: kPhrases },
  { id: 'g1-set', focus: 'Grade 1 – Magic e & Teams',    phrases: g1Phrases },
  { id: 'g2-set', focus: 'Grade 2 – Diphthongs & Growth', phrases: g2Phrases },
] as const;