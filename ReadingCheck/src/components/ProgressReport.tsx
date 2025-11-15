// src/components/ProgressReport.tsx
import { useEffect, useState } from 'react';
import { PHRASE_SETS, type Phrase } from '../constants/phrases';
import { getStudentProgress, getAttemptHistory } from '../storage';
import type { Attempt } from '../model';
import './ProgressReport.css';

interface ProgressReportProps {
  studentId: string;
}

interface ProgressMetric {
  attemptNumber: number;
  overallAccuracy: number;
  avgDuration: string;
  sightWordAccuracy: number;
  topPhoneticErrors: string;
  topSightWordErrors: string;
  topPhoneticPatternErrors: string;
  completionRate: string;
  totalPhrases: number;
  completedPhrases: number;
  setId: string;
  setName: string;
}

export const ProgressReport = ({ studentId }: ProgressReportProps) => {
  const [progress, setProgress] = useState(() => getStudentProgress(studentId));
  const [metrics, setMetrics] = useState<ProgressMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateMetrics = () => {
      setLoading(true);
      
      // Get ALL attempts for this student
      const allAttempts = getAttemptHistory();
      const studentAttempts = allAttempts
        .filter(attempt => attempt.studentId === studentId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      const currentProgress = getStudentProgress(studentId);
      setProgress(currentProgress);

      if (!currentProgress || !PHRASE_SETS.length || studentAttempts.length === 0) {
        setMetrics([]);
        setLoading(false);
        return;
      }
      
      // Get current set info
      const currentSetIndex = currentProgress.currentSet || 0;
      const currentSet = PHRASE_SETS[currentSetIndex];

      if (!currentSet) {
        setMetrics([]);
        setLoading(false);
        return;
      }

      const currentPhrases = currentSet.phrases;
      const totalPhrases = currentPhrases.length;

      // Group attempts by natural progression (each 5 attempts = one "round")
      const attemptsPerRound = Math.max(5, totalPhrases); // Use 5 or total phrases, whichever is larger
      const rounds: Attempt[][] = [];
      
      for (let i = 0; i < studentAttempts.length; i += attemptsPerRound) {
        rounds.push(studentAttempts.slice(i, i + attemptsPerRound));
      }

      // Calculate metrics for each round
      const calculatedMetrics: ProgressMetric[] = rounds.map((round, index) => {
        const roundData = {
          accuracy: 0,
          durationMs: 0,
          phoneticErrors: {} as Record<string, number>,
          sightWordErrors: {} as Record<string, number>,
          phoneticPatternErrors: {} as Record<string, number>,
          sightWordAccuracy: 0,
          uniquePhrases: new Set<string>(),
          validAttempts: 0
        };

        round.forEach(attempt => {
          roundData.accuracy += attempt.accuracy;
          roundData.durationMs += attempt.durationMs;
          roundData.uniquePhrases.add(attempt.phraseId);
          roundData.validAttempts++;

          // Capture phonetic errors
          if (attempt.details?.mispronouncedWords) {
            attempt.details.mispronouncedWords.forEach(({ word }: { word: string }) => {
              const cleanWord = word.toLowerCase().trim();
              if (cleanWord) {
                roundData.phoneticErrors[cleanWord] = (roundData.phoneticErrors[cleanWord] || 0) + 1;
              }
            });
          }

          // Capture sight word errors
          if (attempt.details?.sightWordAccuracy) {
            Object.entries(attempt.details.sightWordAccuracy).forEach(([word, isCorrect]) => {
              if (isCorrect === false) {
                const cleanWord = word.toLowerCase().trim();
                if (cleanWord) {
                  roundData.sightWordErrors[cleanWord] = (roundData.sightWordErrors[cleanWord] || 0) + 1;
                }
              }
            });
            roundData.sightWordAccuracy += attempt.sightWordScore || 0;
          }

          // Capture phonetic pattern errors
          if (attempt.details?.phoneticPatternAccuracy) {
            Object.entries(attempt.details.phoneticPatternAccuracy).forEach(([pattern, isCorrect]) => {
              if (isCorrect === false) {
                roundData.phoneticPatternErrors[pattern] = (roundData.phoneticPatternErrors[pattern] || 0) + 1;
              }
            });
          }
        });

        const completionRate = (roundData.uniquePhrases.size / totalPhrases) * 100;
        const hasValidData = roundData.validAttempts > 0;

        const formatTopErrors = (errors: Record<string, number>, maxItems = 3): string => {
          const errorEntries = Object.entries(errors);
          if (errorEntries.length === 0) return 'None';
          
          return errorEntries
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxItems)
            .map(([error, count]) => `${error} (${count}x)`)
            .join(', ');
        };

        return {
          attemptNumber: index + 1,
          overallAccuracy: hasValidData ? Math.round(roundData.accuracy / roundData.validAttempts) : 0,
          avgDuration: hasValidData ? (roundData.durationMs / roundData.validAttempts / 1000).toFixed(1) : 'N/A',
          sightWordAccuracy: hasValidData ? Math.round(roundData.sightWordAccuracy / roundData.validAttempts) : 0,
          topPhoneticErrors: formatTopErrors(roundData.phoneticErrors),
          topSightWordErrors: formatTopErrors(roundData.sightWordErrors),
          topPhoneticPatternErrors: formatTopErrors(roundData.phoneticPatternErrors),
          completionRate: `${Math.round(completionRate)}%`,
          totalPhrases,
          completedPhrases: roundData.uniquePhrases.size,
          setId: (currentSet as any).id,
          setName: (currentSet as any).focus || (currentSet as any).id,
        };
      });
      
      setMetrics(calculatedMetrics);
      setLoading(false);
    };

    calculateMetrics();
  }, [studentId]);

  const downloadCSV = () => {
    if (metrics.length === 0) return;

    const headers = [
      'Attempt',
      'Set ID',
      'Set Name', 
      'Overall Accuracy (%)',
      'Avg Duration (s)',
      'Sight Word Accuracy (%)',
      'Completion Rate',
      'Completed Phrases',
      'Total Phrases',
      'Top Phonetic Errors',
      'Top Sight Word Errors',
      'Top Pattern Errors'
    ];

    const csvData = metrics.map(metric => [
      metric.attemptNumber,
      metric.setId,
      metric.setName,
      metric.overallAccuracy,
      metric.avgDuration,
      metric.sightWordAccuracy,
      metric.completionRate,
      metric.completedPhrases,
      metric.totalPhrases,
      `"${metric.topPhoneticErrors}"`,
      `"${metric.topSightWordErrors}"`,
      `"${metric.topPhoneticPatternErrors}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `progress-report-${studentId}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="progress-card loading">Loading progress data...</div>;
  }

  const currentSetIndex = progress?.currentSet || 0;
  const currentSet = PHRASE_SETS[currentSetIndex];

  if (!progress || !currentSet) {
    return <div className="progress-card">No progress data found for {studentId}</div>;
  }

  return (
    <div className="progress-card">
      <div className="progress-header">
        <h3>Progress Report for {studentId}</h3>
        <p>
          Current Set: {currentSet.id} ({currentSetIndex + 1}/{PHRASE_SETS.length})
        </p>
        {metrics.length > 0 && (
          <button 
            onClick={downloadCSV}
            className="download-btn"
          >
            Download CSV
          </button>
        )}
      </div>
      
      <div className="table-container">
        <table className="progress-table" aria-label="Student progress metrics">
          <thead>
            <tr>
              <th>Round</th>
              <th>Set</th>
              <th>Accuracy</th>
              <th>Duration (s)</th>
              <th>Sight Words</th>
              <th>Completion</th>
              <th>Phrases Done</th>
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
                  <td>{metric.setId}</td>
                  <td>{metric.overallAccuracy}%</td>
                  <td>{metric.avgDuration}</td>
                  <td>{metric.sightWordAccuracy}%</td>
                  <td>{metric.completionRate}</td>
                  <td>{metric.completedPhrases}/{metric.totalPhrases}</td>
                  <td className="error-cell">{metric.topPhoneticErrors}</td>
                  <td className="error-cell">{metric.topSightWordErrors}</td>
                  <td className="error-cell">{metric.topPhoneticPatternErrors}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="no-data">
                  No progress data available yet. Complete some phrases to see your progress.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Debug info - remove in production */}
      <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
        <strong>Debug Info:</strong> Found {getAttemptHistory().filter(a => a.studentId === studentId).length} total attempts for {studentId}
      </div>
    </div>
  );
};

export default ProgressReport;