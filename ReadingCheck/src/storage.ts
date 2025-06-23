// src/storage.ts
import type { Attempt } from './model';
import { PHRASE_SETS, type Phrase } from './constants/phrases';

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

export const getPhraseById = (phraseId: string): Phrase | undefined => {
  for (const set of PHRASE_SETS) {
    const phrase = set.phrases.find(p => p.id === phraseId);
    if (phrase) return phrase;
  }
  return undefined;
};