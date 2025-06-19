import React, { useState } from 'react';
import type { Attempt } from '../model';
import HistoryTable_Details from './HistoryTable_Details';

interface HistoryTableOverviewProps {
  attempts: Attempt[];
  onDeleteSession: (sessionId: string) => void;
}

const HistoryTable_Overview: React.FC<HistoryTableOverviewProps> = ({ 
  attempts, 
  onDeleteSession 
}) => {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const groupAttemptsBySession = () => {
    const grouped: Record<string, Attempt[]> = {};
    
    attempts.forEach(attempt => {
      const date = new Date(attempt.timestamp);
      const sessionKey = `${attempt.studentId}-${date.toDateString()}`;
      
      grouped[sessionKey] = grouped[sessionKey] || [];
      grouped[sessionKey].push(attempt);
    });
    
    return grouped;
  };

  const calculatePhoneticInsights = (sessionAttempts: Attempt[]) => {
    let totalPhoneticPatterns = 0;
    let correctPhoneticPatterns = 0;
    let commonMispronunciations: Record<string, number> = {};

    sessionAttempts.forEach(attempt => {
      if (attempt.details?.phoneticPatternAccuracy) {
        const patterns = Object.entries(attempt.details.phoneticPatternAccuracy);
        totalPhoneticPatterns += patterns.length;
        correctPhoneticPatterns += patterns.filter(([, correct]) => correct).length;
      }

      attempt.details?.mispronouncedWords?.forEach(({ word, attempted }) => {
        const key = `${word}→${attempted}`;
        commonMispronunciations[key] = (commonMispronunciations[key] || 0) + 1;
      });
    });

    const topMispronunciation = Object.entries(commonMispronunciations)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      phoneticAccuracy: totalPhoneticPatterns > 0 
        ? Math.round((correctPhoneticPatterns / totalPhoneticPatterns) * 100)
        : 100,
      topMispronunciation: topMispronunciation 
        ? `${topMispronunciation[0]} (${topMispronunciation[1]}x)`
        : 'None'
    };
  };

  const groupedAttempts = groupAttemptsBySession();

  if (!attempts.length) {
    return <div className="no-attempts-message">No practice attempts recorded yet.</div>;
  }

  return (
    <div className="session-overview">
      {Object.entries(groupedAttempts).map(([sessionId, sessionAttempts]) => {
        const firstAttempt = sessionAttempts[0];
        const date = new Date(firstAttempt.timestamp);
        const { phoneticAccuracy, topMispronunciation } = calculatePhoneticInsights(sessionAttempts);
        const correctPhrases = sessionAttempts.filter(a => a.accuracy > 80).length;

        return (
          <div key={sessionId} className="session-card">
            <div className="session-summary">
              <div className="session-header">
                <h3>{firstAttempt.studentId}</h3>
                <div>{date.toLocaleDateString()} at {date.toLocaleTimeString()}</div>
              </div>
              
              <div className="phonetic-insights">
                <div className="insight">
                  <span>Phonetic Accuracy:</span>
                  <span className={`value ${phoneticAccuracy < 70 ? 'low' : ''}`}>
                    {phoneticAccuracy}%
                  </span>
                </div>
                <div className="insight">
                  <span>Common Error:</span>
                  <span className="value">{topMispronunciation}</span>
                </div>
              </div>

              <div className="session-metrics">
                <div className="metric">
                  <span>Correct Phrases:</span>
                  <span>{correctPhrases}/{sessionAttempts.length}</span>
                </div>
                <div className="metric">
                  <span>Avg. Duration:</span>
                  <span>
                    {(
                      sessionAttempts.reduce((sum, a) => sum + (a.durationMs || 0), 0) / 
                      sessionAttempts.length / 1000
                    ).toFixed(1)}s
                  </span>
                </div>
              </div>

              <div className="session-actions">
                <button 
                  onClick={() => setExpandedSession(expandedSession === sessionId ? null : sessionId)}
                  className="toggle-details"
                >
                  {expandedSession === sessionId ? '▲ Hide Details' : '▼ Show Phonetic Analysis'}
                </button>
                <button 
                  onClick={() => onDeleteSession(sessionId)}
                  className="delete-session"
                >
                  Delete Session
                </button>
              </div>
            </div>
            
            {expandedSession === sessionId && (
              <HistoryTable_Details attempts={sessionAttempts} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HistoryTable_Overview;