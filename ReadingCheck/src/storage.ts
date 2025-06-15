// src/storage.ts
import type { Attempt } from './model';
import { PHRASES } from './constants/phrases';

const APP_VERSION = 2;
const STORAGE_KEY = `speechApp_attempts_v${APP_VERSION}`;

// Generate sample attempts
const generateSampleAttempt = (studentId: string, phraseIndex: number): Attempt => {
  const phrase = PHRASES[phraseIndex];
  const accuracy = 70 + Math.floor(Math.random() * 30); // 70-100%
  const sightWordScore = 60 + Math.floor(Math.random() * 40); // 60-100%
  const phoneticScore = 50 + Math.floor(Math.random() * 50); // 50-100%
  
  return {
    id: crypto.randomUUID(),
    studentId,
    phraseId: phrase.id,
    timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)), // Last 7 days
    durationMs: 3000 + Math.floor(Math.random() * 7000), // 3-10 seconds
    targetPhrase: phrase.text,
    attemptedPhrase: phrase.text.split(' ').map(word => 
      Math.random() > 0.2 ? word : word.slice(0, -1) + 'x' // Simulate some errors
    ).join(' '),
    accuracy,
    sightWordScore,
    phoneticScore,
    feedback: accuracy > 85 ? 'Good job!' : 'Needs practice',
    details: {
      missingWords: Math.random() > 0.8 ? [phrase.text.split(' ')[0]] : [],
      extraWords: [],
      mispronouncedWords: Math.random() > 0.7 ? [
        { 
          word: phrase.text.split(' ')[1], 
          attempted: phrase.text.split(' ')[1] + 'x' 
        }
      ] : [],
      sightWordAccuracy: phrase.sightWords.reduce((acc, word) => ({
        ...acc,
        [word]: Math.random() > 0.3
      }), {}),
      phoneticPatternAccuracy: phrase.phoneticPatterns?.reduce((acc, pattern) => ({
        ...acc,
        [pattern]: Math.random() > 0.4
      }), {}) || {}
    }
  };
};

// Initialize with sample data if empty
const initializeSampleData = (): Attempt[] => {
  const sampleStudents = ['alice123', 'bob456', 'charlie789'];
  const attempts: Attempt[] = [];
  
  sampleStudents.forEach(student => {
    PHRASES.forEach((_, index) => {
      attempts.push(generateSampleAttempt(student, index));
      if (Math.random() > 0.5) { // Add some extra attempts
        attempts.push(generateSampleAttempt(student, index));
      }
    });
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
  return attempts;
};

export const getAttemptHistory = (): Attempt[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    
    // Initialize with sample data if empty (development only)
    if (!data) {
      if (process.env.NODE_ENV === 'development') {
        return initializeSampleData();
      }
      return [];
    }
    
    return JSON.parse(data).map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp)
    }));
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

export const clearHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getAttemptsByStudent = (studentId: string): Attempt[] => {
  return getAttemptHistory()
    .filter(a => a.studentId === studentId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};