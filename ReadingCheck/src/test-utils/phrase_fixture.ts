// src/test-utils/phrases_fixture.ts

import { PHRASE_SETS, type Phrase } from '../constants/phrases';

export const buildTestPhrase = (overrides: Partial<Phrase> = {}): Phrase => {
  const base = PHRASE_SETS[0]?.phrases?.[0];
  const basePhrase: Phrase = {
    id: base?.id ?? 'test-id',
    text: base?.text ?? 'Test phrase',
    sightWords: [...(base?.sightWords ?? [])],
    phoneticPatterns: [...(base?.phoneticPatterns ?? [])],
    ...overrides,
  };

  return {
    ...basePhrase,
    sightWords: overrides.sightWords ?? basePhrase.sightWords,
    phoneticPatterns: overrides.phoneticPatterns ?? basePhrase.phoneticPatterns,
  };
};

export const getAllPhrases = (): Phrase[] => {
  return PHRASE_SETS.flatMap(set => set.phrases);
};

export const findPhraseById = (id: string): Phrase | undefined => {
  return getAllPhrases().find(p => p.id === id);
};
export const findPhrasesByText = (text: string): Phrase[] => {
  return getAllPhrases().filter(p => p.text.includes(text));
};