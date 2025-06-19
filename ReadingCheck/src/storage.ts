// src/storage.ts
import type { Attempt } from './model';
import { PHRASES } from './constants/phrases';

const APP_VERSION = 2;
const STORAGE_KEY = `readingApp_attempts_v${APP_VERSION}`;

/**
 * Creates a single sample attempt with realistic data
 * for demonstration purposes
 */
const createSampleAttempt = (): Attempt => {
  // Use the first phrase from PHRASES
  const samplePhrase = PHRASES[0]; 
  
  return {
    id: crypto.randomUUID(),
    studentId: 'Demo_Student',
    phraseId: samplePhrase.id,
    timestamp: new Date(), // Current time
    durationMs: 4500, // 4.5 seconds
    targetPhrase: samplePhrase.text,
    attemptedPhrase: samplePhrase.text, // Perfect attempt
    accuracy: 88,
    sightWordScore: 92,
    phoneticScore: 85,
    feedback: 'Good fluency, watch vowel sounds',
    details: {
      missingWords: [],
      extraWords: [],
      mispronouncedWords: [
        { word: "that", attempted: "dat" } // One common error
      ],
      sightWordAccuracy: samplePhrase.sightWords.reduce((acc, word) => ({
        ...acc,
        [word]: word !== "that" // Mark "that" as incorrect
      }), {}),
      phoneticPatternAccuracy: {
        "th": false, // Got the "th" sound wrong
        "sh": true   // Got the "sh" sound right
      }
    }
  };
};

/**
 * Initialize storage with exactly one sample attempt
 */
const initializeSampleData = (): Attempt[] => {
  const sampleAttempt = createSampleAttempt();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([sampleAttempt]));
  return [sampleAttempt];
};

export const getAttemptHistory = (): Attempt[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    
    // Only initialize sample data in development mode when empty
    if (!data && process.env.NODE_ENV === 'development') {
      return initializeSampleData();
    }
    
    return data ? JSON.parse(data).map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp) // Ensure proper Date objects
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
    timestamp: new Date(attempt.timestamp) // Ensure proper Date object
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newAttempt, ...history]));
  return newAttempt;
};

export const deleteAttempt = (attemptId: string): void => {
  const history = getAttemptHistory();
  const updatedHistory = history.filter(attempt => attempt.id !== attemptId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
};

export const deleteStudentAttempts = (studentId: string): void => {
  const history = getAttemptHistory();
  const updatedHistory = history.filter(attempt => attempt.studentId !== studentId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
};

export const clearAllAttempts = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getAttemptsByStudent = (studentId: string): Attempt[] => {
  return getAttemptHistory()
    .filter(a => a.studentId === studentId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// Type guard for Attempt
const isAttempt = (obj: any): obj is Attempt => {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.studentId === 'string' &&
    obj.timestamp instanceof Date;
};