// src/storage.ts
import type { Attempt } from './model';
import { PHRASE_SETS, type Phrase } from './constants/phrases';

const APP_VERSION = 2;
const STORAGE_KEY = `readingApp_attempts_v${APP_VERSION}`;

/**
 * Creates a single sample attempt with realistic data
 */
const createSampleAttempt = (): Attempt => {
  const samplePhrase = PHRASE_SETS[0].phrases[0];
  
  return {
    id: crypto.randomUUID(),
    studentId: 'Demo_Student',
    phraseId: samplePhrase.id,
    timestamp: new Date(),
    durationMs: 4500,
    targetPhrase: samplePhrase.text,
    attemptedPhrase: samplePhrase.text.replace("strong", "stong"), // Intentional error
    accuracy: 88,
    sightWordScore: 92,
    phoneticScore: 85,
    feedback: 'Good fluency, watch "str" blends',
    details: {
      missingWords: [],
      extraWords: [],
      mispronouncedWords: [
        { word: "strong", attempted: "stong" }
      ],
      sightWordAccuracy: samplePhrase.sightWords.reduce((acc, word) => ({
        ...acc,
        [word]: true // All sight words correct
      }), {}),
      phoneticPatternAccuracy: {
        "str": false, // Got the "str" blend wrong
        "ng": true    // Got the "ng" ending right
      }
    }
  };
};

/**
 * Initialize storage with sample data
 */
const initializeSampleData = (): Attempt[] => {
  const sampleAttempt = createSampleAttempt();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([sampleAttempt]));
  return [sampleAttempt];
};

export const getAttemptHistory = (): Attempt[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    
    if (!data && process.env.NODE_ENV === 'development') {
      return initializeSampleData();
    }
    
    return data ? JSON.parse(data).map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp)
    })) : [];
  } catch (error) {
    console.error('Failed to parse attempt history', error);
    return [];
  }
};

export const saveAttempt = (attempt: Omit<Attempt, 'id'>): Attempt => {
  const history = getAttemptHistory();
  const newAttempt: Attempt = {
    ...attempt,
    id: crypto.randomUUID(),
    timestamp: new Date(attempt.timestamp)
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newAttempt, ...history]));
  return newAttempt;
};

export const deleteAttempt = (attemptId: string): void => {
  const history = getAttemptHistory();
  const updatedHistory = history.filter(attempt => attempt.id !== attemptId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
};

// Add this function to your existing storage.ts file
export const deleteStudentAttempts = (studentId: string): void => {
  const history = getAttemptHistory();
  const updatedHistory = history.filter(attempt => attempt.studentId !== studentId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
};

export const getAttemptsByStudent = (studentId: string): Attempt[] => {
  return getAttemptHistory()
    .filter(a => a.studentId === studentId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

interface StudentProgress {
  currentSet: number;
  completedPhrases: {
    [phraseId: string]: {
      attempts: number;
      lastAccuracy: number;
      mastered: boolean;
    };
  };
}

export const getStudentProgress = (studentId: string): StudentProgress => {
  const data = localStorage.getItem(`progress_${studentId}`);
  return data ? JSON.parse(data) : { 
    currentSet: 0, 
    completedPhrases: {} 
  };
};

export const saveStudentProgress = (
  studentId: string, 
  progress: StudentProgress
) => {
  localStorage.setItem(`progress_${studentId}`, JSON.stringify(progress));
};

export const recordAttempt = (
  studentId: string,
  phraseId: string,
  accuracy: number
) => {
  const progress = getStudentProgress(studentId);
  
  // Update phrase record
  if (!progress.completedPhrases[phraseId]) {
    progress.completedPhrases[phraseId] = {
      attempts: 0,
      lastAccuracy: 0,
      mastered: false
    };
  }
  
  const phraseRecord = progress.completedPhrases[phraseId];
  phraseRecord.attempts++;
  phraseRecord.lastAccuracy = accuracy;
  phraseRecord.mastered = accuracy >= 90;
  
  // Advance set if 80% of phrases mastered
  const currentPhrases = PHRASE_SETS[progress.currentSet].phrases;
  const masteredCount = currentPhrases.filter(p => 
    progress.completedPhrases[p.id]?.mastered
  ).length;
  
  if (masteredCount / currentPhrases.length >= 0.8) {
    progress.currentSet = Math.min(progress.currentSet + 1, PHRASE_SETS.length - 1);
  }
  
  saveStudentProgress(studentId, progress);
};

// Utility function to find phrase by ID
export const getPhraseById = (phraseId: string): Phrase | undefined => {
  for (const set of PHRASE_SETS) {
    const phrase = set.phrases.find(p => p.id === phraseId);
    if (phrase) return phrase;
  }
  return undefined;
};