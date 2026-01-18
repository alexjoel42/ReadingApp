/**
 * NEW: Structure for a 4th-grade level comprehension question
 */
export interface ComprehensionQuestion {
  id: string;
  question: string;
  options: { 
    a: string; 
    b: string; 
    c: string; 
    d: string 
  };
  correctAnswer: 'a' | 'b' | 'c' | 'd';
}

/**
 * Represents a practice phrase or reading passage.
 * Uses optional fields to support both K-2 Phonics and 4th Grade Comprehension.
 */
export interface Phrase {
  id: string;
  text: string;
  // Phonics Metadata (Optional for Comprehension Passages)
  difficulty?: 'easy' | 'medium' | 'hard';
  sightWords?: readonly string[]; 
  phoneticPatterns?: readonly string[]; 
  // Comprehension Metadata (Optional for Phonics Phrases)
  title?: string; 
  questions?: ComprehensionQuestion[]; 
}

/**
 * Represents a student's attempt at a phrase or a quiz session
 */
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
    missingWords?: string[];
    extraWords?: string[];
    mispronouncedWords?: {
      word: string;
      attempted: string;
    }[];
    sightWordAccuracy?: Record<string, boolean>;
    phoneticPatternAccuracy?: Record<string, boolean>;
    // Allows for tracking 'comprehension' vs 'fluency' in the dashboard
    type?: 'fluency' | 'comprehension';
    quizResults?: any;
  };
}

/**
 * Container for multiple phrases (e.g., a grade-level set)
 */
export interface PhraseSet {
  id: string;
  focus: string;
  phrases: Phrase[];
}

export interface TeacherDashboardProps {
  attempts: Attempt[];
  onAttemptsUpdate: () => void;
}

export const STORAGE_KEY = `speechApp_attempts_v2`;

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