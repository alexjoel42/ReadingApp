// src/storage.ts
import type { Attempt, StudentProgress, Phrase, PhraseSet } from './model'; 
import { PHRASE_SETS } from './constants/phrases';
import { db } from './db';
import { FOURTH_GRADE_SAMPLE } from './constants/Reading_Questions_Constants';

const APP_VERSION = 2;
export const STORAGE_KEY = `readingApp_attempts_v${APP_VERSION}`;

// ========== ATTEMPTS (LocalStorage) ==========

/**
 * Retrieves all student attempts from local storage.
 * Sorted newest first.
 */
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

/**
 * Saves a new attempt to the history using a UUID.
 */
export const saveAttempt = (attempt: Omit<Attempt, 'id'>): Attempt => {
  const history = getAttemptHistory();
  const newAttempt: Attempt = {
    ...attempt,
    id: crypto.randomUUID(),
    timestamp: new Date(attempt.timestamp)
  } as Attempt; // Type cast to satisfy strict unified Attempt interface
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newAttempt, ...history]));
  return newAttempt;
};

/**
 * Deletes a single specific attempt by ID.
 */
export const deleteAttempt = (attemptId: string): void => {
  const history = getAttemptHistory();
  const updatedHistory = history.filter(attempt => attempt.id !== attemptId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
};

/**
 * Deletes all recorded attempts for a specific student.
 */
export const deleteStudentAttempts = (studentId: string): void => {
  const history = getAttemptHistory();
  const updatedHistory = history.filter(attempt => attempt.studentId !== studentId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
};

// ========== PROGRESS (LocalStorage) ==========

/**
 * Retrieves current mastery and set progress for a student.
 */
export const getStudentProgress = (studentId: string): any => {
  const data = localStorage.getItem(`progress_${studentId}`);
  return data ? JSON.parse(data) : { 
    currentSet: 0, 
    completedPhrases: {} 
  };
};

/**
 * Persists student progress to localStorage.
 */
export const saveStudentProgress = (
  studentId: string, 
  progress: any
) => {
  localStorage.setItem(`progress_${studentId}`, JSON.stringify(progress));
};

// ========== PHRASE SETS (Hybrid Logic: Static + Virtual + DB) ==========

/**
 * Aggregates all phrase sets: Static Phonics, Virtual Comprehension, and Dexie Imports.
 */
export const getAllPhraseSets = async (): Promise<PhraseSet[]> => {
  try {
    const importedSets = await db.phraseSets.toArray();
    
    // Virtual set for Grade 4 Comprehension
    const compSet: PhraseSet = {
      id: 'grade-4-comp-sample',
      focus: '4th Grade Comprehension',
      phrases: FOURTH_GRADE_SAMPLE.map(p => ({
        id: p.id,
        text: p.text,
        title: p.title,
        questions: p.questions, // Validated by unified Phrase interface
        difficulty: 'medium',
        sightWords: [],
        phoneticPatterns: []
      }))
    };

    return [...PHRASE_SETS, compSet, ...importedSets] as PhraseSet[];
  } catch (err) {
    console.warn('Could not load imported sets, using static only', err);
    return [...PHRASE_SETS] as PhraseSet[];
  }
};

/**
 * Finds a set by ID (checks static, then virtual comp, then imported).
 */
export const getPhraseSetById = async (setId: string): Promise<PhraseSet | undefined> => {
  // 1. Check existing K-2 PHRASE_SETS
  const staticSet = PHRASE_SETS.find(s => s.id === setId);
  if (staticSet) return staticSet as PhraseSet;

  // 2. Grab from Reading_Questions_Constants.ts
  const compSample = FOURTH_GRADE_SAMPLE.find(p => p.id === setId);
  if (compSample || setId === 'grade-4-comp-sample') {
    return {
      id: 'grade-4-comp-sample',
      focus: '4th Grade Comprehension',
      phrases: FOURTH_GRADE_SAMPLE.map(p => ({
        id: p.id,
        text: p.text,
        title: p.title,
        questions: p.questions, // This now works with the model.ts update!
        difficulty: 'medium',
        sightWords: [],
        phoneticPatterns: []
      }))
    } as PhraseSet;
  }
  
  try {
    return await db.phraseSets.get(setId) as PhraseSet | undefined;
  } catch (err) {
    return undefined;
  }
};

/**
 * Searches across all sets to find a specific phrase.
 */
export const getPhraseById = async (phraseId: string): Promise<Phrase | undefined> => {
  const allSets = await getAllPhraseSets();
  for (const set of allSets) {
    const phrase = set.phrases.find(p => p.id === phraseId);
    if (phrase) return phrase;
  }
  return undefined;
};

// ========== RECORD ATTEMPT (Fluency Mastery Tracking) ==========

/**
 * Updates mastery status (90% accuracy = mastered) in student progress.
 */
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
  
  saveStudentProgress(studentId, progress);
};

export { db };