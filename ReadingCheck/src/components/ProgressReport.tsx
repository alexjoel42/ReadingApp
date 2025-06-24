// src/components/ProgressReport.tsx
import React, { useMemo } from 'react';
import { PHRASE_SETS, type Phrase } from '../constants/phrases';
import { evaluatePronunciation } from '../lib/pronunciationEvaluator';
import { getStudentProgress, getPhraseById } from '../storage';

interface ProgressReportProps {
  studentId: string;
}

interface AttemptData {
  attemptNumber: number;
  accuracy: number;
  durationMs: number;
  phoneticErrors: { [error: string]: number };
  sightWordErrors: { [error: string]: number };
  phoneticPatternErrors: { [error: string]: number };
  sightWordAccuracy: number;
  phraseCount: number;
  validAttempts: number; // Track how many attempts had valid evaluation data
}

interface ProgressMetric {
  attemptNumber: number;
  overallAccuracy: number;
  avgDuration: string;
  sightWordAccuracy: number;
  topPhoneticErrors: string;
  topSightWordErrors: string;
  topPhoneticPatternErrors: string;
  completionRate: string; // New metric for completion
}

export const ProgressReport = ({ studentId }: ProgressReportProps) => {
  const progress = getStudentProgress(studentId);
  const currentSet = PHRASE_SETS[progress?.currentSet || 0];

  const metrics = useMemo(() => {
    if (!progress || !currentSet) return [];
    
    const currentPhrases = currentSet.phrases as readonly Phrase[];
    if (!currentPhrases?.length) return [];

    const attemptData: Record<number, AttemptData> = {};
    const totalPhrases = currentPhrases.length;

    currentPhrases.forEach((phrase: Phrase) => {
      const record = progress.completedPhrases[phrase.id];
      if (!record) return; // Skip phrases not attempted

      const attemptNumber = record.attempts;
      if (!attemptData[attemptNumber]) {
        attemptData[attemptNumber] = {
          attemptNumber,
          accuracy: 0,
          durationMs: 0,
          phoneticErrors: {},
          sightWordErrors: {},
          phoneticPatternErrors: {},
          sightWordAccuracy: 0,
          phraseCount: 0,
          validAttempts: 0
        };
      }

      const attempt = attemptData[attemptNumber];
      attempt.phraseCount += 1;

      // Only process if we have both the phrase data and an attempted phrase
      const phraseData = getPhraseById(phrase.id);
      if (phraseData && record.attemptedPhrase) {
        const pronunciationEvaluation = evaluatePronunciation(phraseData, record.attemptedPhrase);
        
        if (pronunciationEvaluation) {
          attempt.validAttempts += 1;
          attempt.accuracy += record.lastAccuracy;
          attempt.durationMs += record.durationMs;

          // Track phonetic errors
          pronunciationEvaluation.details.mispronouncedWords.forEach((mispronouncedWord) => {
            const word = mispronouncedWord.word.toLowerCase();
            attempt.phoneticErrors[word] = (attempt.phoneticErrors[word] || 0) + 1;
          });

          // Track sight word errors
          if (phraseData.sightWords) {
            phraseData.sightWords.forEach(sightWord => {
              const isCorrect = pronunciationEvaluation.details.sightWordAccuracy[sightWord];
              if (isCorrect === false) { // Explicit check for false
                const lowerWord = sightWord.toLowerCase();
                attempt.sightWordErrors[lowerWord] = (attempt.sightWordErrors[lowerWord] || 0) + 1;
              }
            });
          }

          // Track phonetic pattern errors
          Object.entries(pronunciationEvaluation.details.phoneticPatternAccuracy).forEach(([pattern, isCorrect]) => {
            if (isCorrect === false) { // Explicit check for false
              attempt.phoneticPatternErrors[pattern] = (attempt.phoneticPatternErrors[pattern] || 0) + 1;
            }
          });

          attempt.sightWordAccuracy += pronunciationEvaluation.score.sightWords;
        }
      }
    });

    // Convert to array and calculate averages
    return Object.values(attemptData)
      .sort((a, b) => a.attemptNumber - b.attemptNumber)
      .map((attempt) => {
        const completionRate = (attempt.phraseCount / totalPhrases) * 100;
        const hasValidData = attempt.validAttempts > 0;

        const formatTopErrors = (errors: Record<string, number>, maxItems = 3) => {
          const errorEntries = Object.entries(errors);
          if (errorEntries.length === 0) return 'None';
          
          return errorEntries
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxItems)
            .map(([error, count]) => `${error} (${count}x)`)
            .join(', ');
        };

        return {
          attemptNumber: attempt.attemptNumber,
          overallAccuracy: hasValidData ? Math.round(attempt.accuracy / attempt.validAttempts) : 0,
          avgDuration: hasValidData ? (attempt.durationMs / attempt.validAttempts / 1000).toFixed(1) : 'N/A',
          sightWordAccuracy: hasValidData ? Math.round(attempt.sightWordAccuracy / attempt.validAttempts) : 0,
          topPhoneticErrors: hasValidData ? formatTopErrors(attempt.phoneticErrors) : 'No data',
          topSightWordErrors: hasValidData ? formatTopErrors(attempt.sightWordErrors) : 'No data',
          topPhoneticPatternErrors: hasValidData ? formatTopErrors(attempt.phoneticPatternErrors) : 'No data',
          completionRate: `${Math.round(completionRate)}%`
        };
      });
  }, [studentId, progress, currentSet]);

  if (!progress || !currentSet) {
    return <div className="progress-card loading">Loading progress data...</div>;
  }

  return (
    <div className="progress-card">
      <div className="progress-header">
        <h3>Progress Report for {studentId}</h3>
        <p>
          Current Set: {currentSet.id} ({progress.currentSet + 1}/{PHRASE_SETS.length})
        </p>
      </div>
      
      <div className="table-container">
        <table aria-label="Student progress metrics">
          <thead>
            <tr>
              <th>Attempt</th>
              <th>Accuracy</th>
              <th>Duration (s)</th>
              <th>Sight Words</th>
              <th>Completion</th>
              <th>Top Phonetic Errors</th>
              <th>Top Sight Word Errors</th>
              <th>Top Pattern Errors</th>
            </tr>
          </thead>
          <tbody>
            {metrics.length > 0 ? (
              metrics.map((metric) => (
                <tr key={metric.attemptNumber}>
                  <td>#{metric.attemptNumber}</td>
                  <td>{metric.overallAccuracy}%</td>
                  <td>{metric.avgDuration}</td>
                  <td>{metric.sightWordAccuracy}%</td>
                  <td>{metric.completionRate}</td>
                  <td>{metric.topPhoneticErrors}</td>
                  <td>{metric.topSightWordErrors}</td>
                  <td>{metric.topPhoneticPatternErrors}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="no-data">
                  No progress data available yet. Complete some phrases to see your progress.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProgressReport;