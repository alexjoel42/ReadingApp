// src/model.ts

/**
 * Represents a student's attempt at pronouncing a phrase
 */
// src/model.ts
export interface Attempt {
  id: string;
  studentId: string;
  phraseId: string;
  timestamp: Date;
  durationMs: number;
  targetPhrase: string;
  attemptedPhrase: string;
  accuracy: number;
  sightWordScore: number;
  phoneticScore: number;
  feedback: string;
  details: {
    missingWords: string[];
    extraWords: string[];
    mispronouncedWords: {
      word: string;
      attempted: string;
    }[];
    sightWordAccuracy: Record<string, boolean>;
    phoneticPatternAccuracy: Record<string, boolean>;
  };
}

export interface TeacherDashboardProps {
  attempts: Attempt[];
  onAttemptsUpdate: () => void;
}

export const STORAGE_KEY = `speechApp_attempts_v2`;

/**
 * Represents a practice phrase with linguistic metadata
 */
export interface Phrase {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sightWords: readonly string[]; // Sight words contained in this phrase
  phoneticPatterns?: readonly string[]; // Phonetic patterns in this phrase (optional)
}

/**
 * Type for the pronunciation evaluation results
 */
export interface PronunciationResult {
  feedback: string;
  details: Attempt['details'];
  score: {
    overall: number;
    sightWords: number;
    phoneticPatterns: number;
  };
}

/**
 * Student progress tracking type
 */
export interface StudentProgress {
  studentId: string;
  attempts: Attempt[];
  sightWordMastery: Record<string, number>; // Word to percentage correct
  phoneticMastery: Record<string, number>; // Pattern to percentage correct
}