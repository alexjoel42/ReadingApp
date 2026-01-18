// src/lib/store_results.ts
import { saveAttempt } from '../storage';
import type { Attempt } from '../model';

/**
 * Specifically handles the "porting" of Reading Comprehension quiz results.
 * This is decoupled from standard fluency logic to prevent data pollution.
 */
export const storeComprehensionResult = async (
  studentId: string,
  passageId: string,
  passageTitle: string,
  score: number,
  totalQuestions: number
) => {
  // Calculate accuracy as a percentage for the dashboard
  const accuracy = (score / totalQuestions) * 100;

  // Map the quiz result to the standard Attempt interface
  const newAttempt: Omit<Attempt, 'id'> = {
    studentId,
    phraseId: passageId,
    timestamp: new Date(),
    durationMs: 0, // Timing is not the primary metric for comprehension
    targetPhrase: passageTitle,
    attemptedPhrase: `Quiz Score: ${score}/${totalQuestions}`,
    accuracy: accuracy,
    sightWordScore: 0, // Not applicable for comprehension mode
    phoneticScore: 0,  // Not applicable for comprehension mode
    feedback: `Student correctly answered ${score} out of ${totalQuestions} questions.`,
    details: {
      type: 'comprehension', // Flag for the Dashboard to filter by
      quizResults: {
        rawScore: score,
        totalQuestions: totalQuestions
      },
      // Keep fluency-specific fields empty to avoid breaking the UI
      missingWords: [],
      extraWords: [],
      mispronouncedWords: [],
      sightWordAccuracy: {},
      phoneticPatternAccuracy: {}
    }
  };

  // Persist to localStorage/Dexie via the main storage helper
  return saveAttempt(newAttempt);
};