import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import HistoryTable_Overview from './HistoryTableOverview';
import { deleteAttempt, deleteStudentAttempts } from '../storage';
// import { PhraseSet } from '../constants/phrases';
import type { Attempt, TeacherDashboardProps } from '../model';
import { STORAGE_KEY } from '../model';

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
  attempts, 
  onAttemptsUpdate 
}) => {
  const students = [...new Set(attempts.map(a => a.studentId))];
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

 
  // PROPERLY CALCULATED ANALYTICS
  const { averageAccuracy, sightWordMastery, phoneticMastery } = useMemo(() => {
    const filteredAttempts = selectedStudent 
      ? attempts.filter(a => a.studentId === selectedStudent)
      : attempts;


    if (filteredAttempts.length === 0) {
      return { averageAccuracy: 0, sightWordMastery: 0, phoneticMastery: 0 };    
    }

 // Calculate PROPER averages (sum of percentages / count)
    const accuracySum = filteredAttempts.reduce((sum, a) => sum + a.accuracy, 0);
    const sightWordSum = filteredAttempts.reduce((sum, a) => sum + (a.sightWordScore || 0), 0);
    const phoneticSum = filteredAttempts.reduce((sum, a) => sum + (a.phoneticScore || 0), 0);
    const count = filteredAttempts.length;
    return {
      averageAccuracy: accuracySum/count,
      sightWordMastery: sightWordSum/count,
      phoneticMastery: phoneticSum/count
    };
  }, [attempts, selectedStudent]);
  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm('Delete this entire practice session?')) {
      const [studentId, dateStr] = sessionId.split('-');
      const date = new Date(dateStr);
      
      attempts
        .filter(a => 
          a.studentId === studentId && 
          new Date(a.timestamp).toDateString() === date.toDateString()
        )
        .forEach(a => deleteAttempt(a.id));
      
      onAttemptsUpdate();
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Class Progress</h2>
        <div className="dashboard-controls">
          <Link to="/" className="back-button">
            Back to Practice
          </Link>
          {attempts.length > 0 && (
            <div className="view-toggle">
              <button
                className={viewMode === 'overview' ? 'active' : ''}
                onClick={() => setViewMode('overview')}
              >
                Overview
              </button>
              <button
                className={viewMode === 'detailed' ? 'active' : ''}
                onClick={() => setViewMode('detailed')}
              >
                Details
              </button>
            </div>
          )}
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="empty-state">
          <h3>No attempts recorded yet</h3>
          <p>Students need to complete practice sessions to see data here.</p>
          {process.env.NODE_ENV === 'development' && (
            <button 
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                onAttemptsUpdate();
              }}
              className="sample-data-button"
            >
              Generate Sample Data (Dev Only)
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="stats-overview">
            <div className="stat-card">
              <h3>Students</h3>
              <p>{students.length}</p>
            </div>
            <div className="stat-card">
              <h3>Avg. Accuracy</h3>
              <p>{averageAccuracy.toFixed(1)}%</p>
            </div>
            <div className="stat-card">
              <h3>Sight Words</h3>
              <p>{(sightWordMastery).toFixed(1)}%</p>
            </div>
            <div className="stat-card">
              <h3>Phonetics</h3>
              <p>{(phoneticMastery).toFixed(1)}%</p>
            </div>
          </div>

          <div className="student-filter">
            <select
              value={selectedStudent || ''}
              onChange={(e) => setSelectedStudent(e.target.value || null)}
            >
              <option value="">All Students</option>
              {students.map(student => (
                <option key={student} value={student}>
                  {student}
                </option>
              ))}
            </select>
          </div>

          <div className="results-container">
            {viewMode === 'overview' ? (
              <HistoryTable_Overview 
                attempts={selectedStudent 
                  ? attempts.filter(a => a.studentId === selectedStudent)
                  : attempts
                }
                onDeleteSession={handleDeleteSession}
              />
            ) : (
              <div className="detailed-results">
                {/* Keep your existing table as fallback or remove */}
                <p className="mode-notice">
                  Detailed table view would go here. Consider using HistoryTable_Details
                  for phonetic pattern analysis.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherDashboard;