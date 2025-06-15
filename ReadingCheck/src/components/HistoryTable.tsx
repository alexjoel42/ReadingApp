// src/components/HistoryTable.tsx
import React from 'react';
import type { Attempt, Phrase } from '../model';

interface HistoryTableProps {
  attempts: Attempt[];
  phrases: Phrase[];
  showStudentColumn: boolean;
  onDeleteAttempt: (attemptId: string) => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({ 
  attempts = [], 
  phrases = [],
  showStudentColumn,
  onDeleteAttempt 
}) => {
  // Safe phrase text retrieval with fallback
  const getPhraseText = (phraseId: string) => {
    try {
      return phrases.find(p => p.id === phraseId)?.text || phraseId;
    } catch (error) {
      console.error('Error finding phrase:', error);
      return phraseId;
    }
  };

  // Safe date formatting
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Safe number formatting
  const formatScore = (score?: number) => {
    return score !== undefined ? `${score.toFixed(1)}%` : 'N/A';
  };

  if (!attempts || attempts.length === 0) {
    return (
      <div className="no-attempts-message">
        No practice attempts recorded yet.
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="history-table">
        <thead>
          <tr>
            {showStudentColumn && <th>Student</th>}
            <th>Date</th>
            <th>Phrase</th>
            <th>Attempt</th>
            <th>Accuracy</th>
            <th>Sight Words</th>
            <th>Phonetics</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map(attempt => (
            <tr key={attempt.id}>
              {showStudentColumn && <td>{attempt.studentId}</td>}
              <td>{formatDate(attempt.timestamp)}</td>
              <td>{getPhraseText(attempt.phraseId)}</td>
              <td className="attempt-cell">{attempt.attemptedPhrase}</td>
              <td>{formatScore(attempt.accuracy)}</td>
              <td>{formatScore(attempt.sightWordScore)}</td>
              <td>{formatScore(attempt.phoneticScore)}</td>
              <td>
                <button 
                  onClick={() => onDeleteAttempt(attempt.id)}
                  className="delete-button"
                  aria-label={`Delete attempt from ${formatDate(attempt.timestamp)}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryTable;