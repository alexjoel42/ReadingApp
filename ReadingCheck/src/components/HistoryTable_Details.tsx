import React from 'react';
import type { Attempt } from '../model';

interface HistoryTableDetailsProps {
  attempts: Attempt[];
}

const HistoryTable_Details: React.FC<HistoryTableDetailsProps> = ({ attempts }) => {
  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getPhoneticPatterns = (attempt: Attempt) => {
    if (!attempt.details?.phoneticPatternAccuracy) return 'N/A';
    return Object.entries(attempt.details.phoneticPatternAccuracy)
      .map(([pattern, correct]) => 
        `${pattern}: ${correct ? '✓' : '✗'}`)
      .join(', ');
  };

  const getSightWordResults = (attempt: Attempt) => {
    if (!attempt.details?.sightWordAccuracy) return 'N/A';
    return Object.entries(attempt.details.sightWordAccuracy)
      .map(([word, correct]) => 
        `${word}: ${correct ? '✓' : '✗'}`)
      .join(', ');
  };

  return (
    <div className="phonetic-analysis-details">
      <h4>Detailed Phonetic Analysis</h4>
      <div className="attempts-grid">
        {attempts.map(attempt => (
          <div key={attempt.id} className="attempt-card">
            <div className="attempt-header">
              <span className="time">{formatTime(new Date(attempt.timestamp))}</span>
              <span className="phrase">"{attempt.targetPhrase}"</span>
              <span className={`accuracy ${attempt.accuracy < 70 ? 'low' : ''}`}>
                {attempt.accuracy}%
              </span>
            </div>
            
            <div className="analysis-section student-response">
              <h5>Student Said:</h5>
              <p className="attempted-phrase">"{attempt.attemptedPhrase}"</p>
            </div>
            
            <div className="analysis-section">
              <h5>Phonetic Patterns:</h5>
              <p>{getPhoneticPatterns(attempt)}</p>
            </div>
            
            <div className="analysis-section">
              <h5>Sight Words:</h5>
              <p>{getSightWordResults(attempt)}</p>
            </div>
            
            {attempt.details?.mispronouncedWords?.length > 0 && (
              <div className="analysis-section error">
                <h5>Mispronunciations:</h5>
                <ul>
                  {attempt.details.mispronouncedWords.map((m, i) => (
                    <li key={i}>
                      <span className="target">{m.word}</span> → 
                      <span className="attempted">{m.attempted}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="attempt-footer">
              <span>Duration: {(attempt.durationMs / 1000).toFixed(1)}s</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryTable_Details;