import { compareTwoStrings } from 'string-similarity';
import levenshtein from 'fast-levenshtein';
import type { Phrase } from '../constants/phrases';

// ======================
// Utility Functions
// ======================

/**
 * Basic phonetic comparison using simplified Soundex algorithm
 */
const phoneticCompare = (a: string, b: string): boolean => {
  const transform = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiouy]/g, '') // Remove vowels
      .replace(/([bfpv]+)/g, 'B')
      .replace(/([cgjkqsxz]+)/g, 'K')
      .replace(/([dt]+)/g, 'T')
      .replace(/([lr]+)/g, 'L')
      .replace(/([mn]+)/g, 'M')
      .replace(/h/g, '')
      .replace(/w/g, '');
  };

  return transform(a) === transform(b);
};

/**
 * Determines if an attempt is close enough to the target to be considered correct
 */
const isSimilarEnough = (target: string, attempt: string): boolean => {
  const stringSim = compareTwoStrings(target, attempt);
  const phonetic = phoneticCompare(target, attempt);
  const levDist = levenshtein.get(target, attempt);

  return (
    phonetic ||
    stringSim > 0.85 ||
    (levDist <= 2 && target.length > 3)
  );
};

/**
 * Identifies words that are phonetically similar but not exact matches
 */
const isMispronounced = (target: string, attempt: string): boolean => {
  const stringSim = compareTwoStrings(target, attempt);
  const phoneticMatch = phoneticCompare(target, attempt);

  return stringSim < 0.9 && phoneticMatch;
};

// ======================
// Core Evaluation
// ======================

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

/**
 * Evaluates pronunciation attempt against target phrase
 */
export const evaluatePronunciation = (
  targetPhrase: Phrase,
  attempt: string
): PronunciationResult => {
  const target = targetPhrase.text;
  const targetWords = target.toLowerCase().split(/\s+/);
  const attemptWords = attempt.toLowerCase().split(/\s+/);

  const missingWords: string[] = [];
  const extraWords: string[] = [];
  const mispronouncedWords: { word: string; attempted: string }[] = [];
  const usedIndices = new Set<number>();

  const sightWordResults: Record<string, boolean> = {};
  const phoneticPatternResults: Record<string, boolean> = {};

  // Match attempt words to target words
  targetWords.forEach((targetWord, targetIndex) => {
    let bestMatchIdx = -1;
    let bestMatchScore = 0;

    attemptWords.forEach((attemptWord, i) => {
      if (usedIndices.has(i)) return;

      const stringSim = compareTwoStrings(targetWord, attemptWord);
      const phonetic = phoneticCompare(targetWord, attemptWord);
      const levDist = levenshtein.get(targetWord, attemptWord);
      const similarity = Math.max(
        stringSim, 
        phonetic ? 0.9 : 0, 
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

      if (isMispronounced(targetWord, matchedWord)) {
        mispronouncedWords.push({ word: targetWord, attempted: matchedWord });
      }

      // Sight word evaluation
      if (targetPhrase.sightWords.includes(targetWord)) {
        sightWordResults[targetWord] = targetWord === matchedWord;
      }

      // Phonetic pattern evaluation
      if (targetPhrase.phoneticPatterns?.[targetIndex]) {
        const pattern = targetPhrase.phoneticPatterns[targetIndex];
        phoneticPatternResults[pattern] = 
          phoneticCompare(targetWord, matchedWord) || 
          levenshtein.get(targetWord, matchedWord) <= 1;
      }
    } else {
      missingWords.push(targetWord);
      if (targetPhrase.sightWords.includes(targetWord)) {
        sightWordResults[targetWord] = false;
      }
    }
  });

  // Identify extra words
  attemptWords.forEach((word, i) => {
    if (!usedIndices.has(i)) {
      extraWords.push(word);
    }
  });

  // Calculate scores
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
    ),
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

// ======================
// Helper Functions
// ======================

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

/**
 * Simplified accuracy calculation
 */
export const calculateAccuracy = (
  targetPhrase: Phrase,
  attempt: string
): number => {
  const targetWords = targetPhrase.text.toLowerCase().split(/\s+/);
  const attemptWords = attempt.toLowerCase().split(/\s+/);

  let correct = 0;
  const usedIndices = new Set<number>();

  targetWords.forEach(targetWord => {
    for (let i = 0; i < attemptWords.length; i++) {
      if (usedIndices.has(i)) continue;
      
      if (isSimilarEnough(targetWord, attemptWords[i])) {
        correct++;
        usedIndices.add(i);
        break;
      }
    }
  });

  return Math.round((correct / targetWords.length) * 100);
};