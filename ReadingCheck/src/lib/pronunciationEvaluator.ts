import compareTwoStrings from 'string-similarity-js';
import levenshtein from 'fast-levenshtein';
import { dictionary as cmudict } from 'cmu-pronouncing-dictionary';
import type { Phrase } from '../constants/phrases';

// Audio analysis utilities
const calculateSpeechRate = (audioBuffer: AudioBuffer): number => {
  const syllableCount = audioBuffer.duration * 3; // Approximate syllables/sec
  return syllableCount / audioBuffer.duration;
};

// Phoneme accommodations
const PHONEME_EQUIVALENCIES: Record<string, string[]> = {
  'TH': ['F', 'V', 'S'], // Common lisp substitutions
  'R': ['W'],           // Child speech pattern
  'S': ['TH'],          // Lisp pattern
  'SH': ['S']           // Accent variation
};

const getPhonemes = (word: string): string[] | null => {
  const entry = cmudict[word.toUpperCase()];
  return entry ? entry[0].split(' ') : null;
};

const isPhonemeMatch = (target: string, actual: string): boolean => {
  return target === actual || PHONEME_EQUIVALENCIES[target]?.includes(actual);
};

export interface PronunciationResult {
  feedback: string;
  details: {
    missingWords: string[];
    extraWords: string[];
    mispronouncedWords: { word: string; attempted: string }[];
    sightWordAccuracy: Record<string, boolean>;
    phoneticPatternAccuracy: Record<string, boolean>;
  };
  score: {
    overall: number;
    sightWords: number;
    phoneticPatterns: number;
  };
}

export const evaluatePronunciation = (
  targetPhrase: Phrase,
  attempt: string,
  audioBuffer?: AudioBuffer
): PronunciationResult => {
  // Speech rate analysis
  let speechRateWarning = '';
  if (audioBuffer) {
    const rate = calculateSpeechRate(audioBuffer);
    if (rate > 5.5) speechRateWarning = ' Try speaking slower for clearer pronunciation.';
  }

  const target = targetPhrase.text;
  const targetWords = target.toLowerCase().split(/\s+/);
  const attemptWords = attempt.toLowerCase().split(/\s+/);

  const missingWords: string[] = [];
  const extraWords: string[] = [];
  const mispronouncedWords: { word: string; attempted: string }[] = [];
  const usedIndices = new Set<number>();

  const sightWordResults: Record<string, boolean> = {};
  const phoneticPatternResults: Record<string, boolean> = {};

  // Match attempt words to target words with phoneme accommodations
  targetWords.forEach((targetWord, targetIndex) => {
    let bestMatchIdx = -1;
    let bestMatchScore = 0;

    attemptWords.forEach((attemptWord, i) => {
      if (usedIndices.has(i)) return;

      // Enhanced comparison with phoneme accommodations
      const targetPhonemes = getPhonemes(targetWord) || [];
      const attemptPhonemes = getPhonemes(attemptWord) || [];
      
      let phonemeScore = 0;
      if (targetPhonemes.length && attemptPhonemes.length) {
        phonemeScore = targetPhonemes.reduce((score, phoneme, j) => {
          return score + (isPhonemeMatch(phoneme, attemptPhonemes[j]) ? 1 : 0);
        }, 0) / targetPhonemes.length;
      }

      const stringSim = compareTwoStrings(targetWord, attemptWord);
      const levDist = levenshtein.get(targetWord, attemptWord);
      
      const similarity = Math.max(
        stringSim,
        phonemeScore,
        1 - levDist / targetWord.length
      );

      if (similarity > bestMatchScore && similarity > 0.6) {
        bestMatchScore = similarity;
        bestMatchIdx = i;
      }
    });

    if (bestMatchIdx !== -1) {
      const matchedWord = attemptWords[bestMatchIdx];
      usedIndices.add(bestMatchIdx);

      if (bestMatchScore < 0.9) {
        mispronouncedWords.push({ word: targetWord, attempted: matchedWord });
      }

      // Sight word evaluation
      if (targetPhrase.sightWords.includes(targetWord)) {
        sightWordResults[targetWord] = bestMatchScore > 0.9;
      }

      // Phonetic pattern evaluation
      if (targetPhrase.phoneticPatterns?.[targetIndex]) {
        const pattern = targetPhrase.phoneticPatterns[targetIndex];
        phoneticPatternResults[pattern] = bestMatchScore > 0.85;
      }
    } else {
      missingWords.push(targetWord);
      if (targetPhrase.sightWords.includes(targetWord)) {
        sightWordResults[targetWord] = false;
      }
    }
  });

  // Calculate scores (unchanged from your original)
  const sightWordAccuracy = Object.values(sightWordResults).filter(Boolean).length;
  const phoneticPatternAccuracy = Object.values(phoneticPatternResults).filter(Boolean).length;

  const overallScore = Math.round(
    (targetWords.length - missingWords.length - mispronouncedWords.length) / 
    targetWords.length * 100
  );

  const sightWordScore = targetPhrase.sightWords.length > 0 
    ? Math.round((sightWordAccuracy / targetPhrase.sightWords.length) * 100)
    : 100;

  const phoneticScore = (targetPhrase.phoneticPatterns?.length ?? 0) > 0
    ? Math.round((phoneticPatternAccuracy / (targetPhrase.phoneticPatterns?.length ?? 1)) * 100)
    : 100;

  return {
    feedback: generateFeedback(
      missingWords,
      extraWords,
      mispronouncedWords,
      sightWordScore,
      phoneticScore
    ) + speechRateWarning, // Append speed warning
    details: {
      missingWords,
      extraWords,
      mispronouncedWords,
      sightWordAccuracy: sightWordResults,
      phoneticPatternAccuracy: phoneticPatternResults
    },
    score: {
      overall: overallScore,
      sightWords: sightWordScore,
      phoneticPatterns: phoneticScore
    }
  };
};

// Helper function remains unchanged
const generateFeedback = (
  missing: string[],
  extra: string[],
  mispronounced: { word: string; attempted: string }[],
  sightWordScore: number,
  phoneticScore: number
): string => {
  const feedbackParts: string[] = [];
  
  if (missing.length > 0) {
    feedbackParts.push(`Missing words: ${missing.join(', ')}`);
  }
  
  if (extra.length > 0) {
    feedbackParts.push(`Extra words: ${extra.join(', ')}`);
  }
  
  if (mispronounced.length > 0) {
    feedbackParts.push(
      `Mispronounced: ${mispronounced.map(m => `${m.word} (as ${m.attempted})`).join(', ')}`
    );
  }
  
  feedbackParts.push(
    `Sight word accuracy: ${sightWordScore}%`,
    `Phonetic accuracy: ${phoneticScore}%`
  );
  
  return feedbackParts.join('. ') || 'Perfect pronunciation!';
};