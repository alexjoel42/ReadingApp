// src/storage.ts
import type { Attempt } from './model';
import { PHRASE_SETS, type Phrase, type PhraseSet } from './constants/phrases';
import { db } from './db';

const APP_VERSION = 2;
export const STORAGE_KEY = `readingApp_attempts_v${APP_VERSION}`;

interface StudentProgress {
  currentSet: number;
  completedPhrases: {
    [phraseId: string]: {
      attemptedPhrase: string;
      attempts: number;
      lastAccuracy: number;
      mastered: boolean;
      durationMs: number;
      timestamp: string;
    };
  };
}

// ========== ATTEMPTS (unchanged - still localStorage) ==========

export const getAttemptHistory = (): Attempt[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
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

export const deleteStudentAttempts = (studentId: string): void => {
  const history = getAttemptHistory();
  const updatedHistory = history.filter(attempt => attempt.studentId !== studentId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
};

// ========== PROGRESS (unchanged - still localStorage) ==========

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

// ========== PHRASE SETS (NEW - hybrid approach) ==========

/**
 * Get all phrase sets: static + imported from Dexie
 */
export const getAllPhraseSets = async (): Promise<PhraseSet[]> => {
  try {
    const importedSets = await db.phraseSets.toArray();
    return [...PHRASE_SETS, ...importedSets];
  } catch (err) {
    console.warn('Could not load imported sets, using static only', err);
    return [...PHRASE_SETS];
  }
};

/**
 * Find a phrase set by ID (checks static first, then imported)
 */
export const getPhraseSetById = async (setId: string): Promise<PhraseSet | undefined> => {
  // Check static sets first
  const staticSet = PHRASE_SETS.find(s => s.id === setId);
  if (staticSet) return staticSet;
  
  // Check imported sets
  try {
    return await db.phraseSets.get(setId);
  } catch (err) {
    console.warn('Could not check imported sets', err);
    return undefined;
  }
};

/**
 * Find a phrase by ID (checks all sets)
 */
export const getPhraseById = async (phraseId: string): Promise<Phrase | undefined> => {
  const allSets = await getAllPhraseSets();
  for (const set of allSets) {
    const phrase = set.phrases.find(p => p.id === phraseId);
    if (phrase) return phrase;
  }
  return undefined;
};

// ========== RECORD ATTEMPT (updated to use hybrid sets) ==========

export const recordAttempt = async (
  studentId: string,
  phraseId: string,
  accuracy: number,
  attemptedPhrase: string,
  durationMs: number
) => {
  const progress = getStudentProgress(studentId);
  
  if (!progress.completedPhrases[phraseId]) {
    progress.completedPhrases[phraseId] = {
      attemptedPhrase,
      attempts: 1,
      lastAccuracy: accuracy,
      mastered: accuracy >= 90,
      durationMs,
      timestamp: new Date().toISOString()
    };
  } else {
    const phraseRecord = progress.completedPhrases[phraseId];
    phraseRecord.attemptedPhrase = attemptedPhrase;
    phraseRecord.attempts++;
    phraseRecord.lastAccuracy = accuracy;
    phraseRecord.mastered = accuracy >= 90;
    phraseRecord.durationMs = durationMs;
    phraseRecord.timestamp = new Date().toISOString();
  }
  
  // Note: Set advancement logic should be handled in the UI
  // since we need to know which set the student is currently using
  
  saveStudentProgress(studentId, progress);
};

export { db };