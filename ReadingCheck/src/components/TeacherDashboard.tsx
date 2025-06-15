// src/components/TeacherDashboard.tsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import HistoryTable from './HistoryTable';
import { deleteAttempt, deleteStudentAttempts } from '../storage';
import { PHRASES } from '../constants/phrases';
import type { Attempt, TeacherDashboardProps } from '../model';
import { STORAGE_KEY } from '../model';

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ attempts, onAttemptsUpdate }) => {
  const students = [...new Set(attempts.map(a => a.studentId))];
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Analytics calculations
  const { averageAccuracy, sightWordMastery, phoneticMastery } = useMemo(() => {
    const filteredAttempts = selectedStudent 
      ? attempts.filter(a => a.studentId === selectedStudent)
      : attempts;

    if (filteredAttempts.length === 0) {
      return {
        averageAccuracy: 0,
        sightWordMastery: 0,
        phoneticMastery: 0
      };
    }

    const accuracySum = filteredAttempts.reduce((sum, a) => sum + a.accuracy, 0);
    const sightWordSum = filteredAttempts.reduce((sum, a) => sum + (a.sightWordScore || 0), 0);
    const phoneticSum = filteredAttempts.reduce((sum, a) => sum + (a.phoneticScore || 0), 0);

    return {
      averageAccuracy: (accuracySum / filteredAttempts.length) * 100,
      sightWordMastery: (sightWordSum / filteredAttempts.length),
      phoneticMastery: (phoneticSum / filteredAttempts.length)
    };
  }, [attempts, selectedStudent]);

  // Problematic words calculation
  const problematicSightWords = useMemo(() => {
    const wordMap = new Map<string, { correct: number; total: number }>();
    
    attempts.forEach(attempt => {
      if (attempt.details?.sightWordAccuracy) {
        Object.entries(attempt.details.sightWordAccuracy).forEach(([word, correct]) => {
          const entry = wordMap.get(word) || { correct: 0, total: 0 };
          entry.correct += correct ? 1 : 0;
          entry.total += 1;
          wordMap.set(word, entry);
        });
      }
    });

    return Array.from(wordMap.entries())
      .filter(([_, { correct, total }]) => correct / total < 0.7)
      .map(([word]) => word);
  }, [attempts]);

  // Delete handlers
  const handleDeleteAttempt = (attemptId: string) => {
    if (window.confirm('Are you sure you want to delete this attempt?')) {
      deleteAttempt(attemptId);
      onAttemptsUpdate();
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    if (window.confirm(`Delete ALL attempts for student ${studentId}? This cannot be undone.`)) {
      deleteStudentAttempts(studentId);
      onAttemptsUpdate();
      setSelectedStudent(null);
    }
  };

  // Sample data handler
  const handleAddSampleData = () => {
    if (window.confirm('Generate sample student data? This will add fake attempts to localStorage.')) {
      localStorage.removeItem(STORAGE_KEY);
      onAttemptsUpdate();
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Class Progress</h2>
        <Link to="/" className="back-button">
          Back to Practice
        </Link>
      </div>

      {attempts.length === 0 ? (
        <div className="empty-state">
          <h3>No attempts recorded yet</h3>
          <p>Students need to complete practice sessions to see data here.</p>
          {process.env.NODE_ENV === 'development' && (
            <button 
              onClick={handleAddSampleData}
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
              <h3>Total Students</h3>
              <p>{students.length}</p>
            </div>
            <div className="stat-card">
              <h3>Total Attempts</h3>
              <p>{attempts.length}</p>
            </div>
            <div className="stat-card">
              <h3>Avg. Accuracy</h3>
              <p>{averageAccuracy.toFixed(1)}%</p>
            </div>
            <div className="stat-card">
              <h3>Sight Word Mastery</h3>
              <p>{(sightWordMastery * 100).toFixed(1)}%</p>
            </div>
            <div className="stat-card">
              <h3>Phonetic Mastery</h3>
              <p>{(phoneticMastery * 100).toFixed(1)}%</p>
            </div>
          </div>

          {problematicSightWords.length > 0 && (
            <div className="problem-words">
              <h3>Common Problem Words:</h3>
              <div className="word-tags">
                {problematicSightWords.map(word => (
                  <span key={word} className="word-tag">{word}</span>
                ))}
              </div>
            </div>
          )}

          <div className="student-filter">
            <select
              value={selectedStudent || ''}
              onChange={(e) => setSelectedStudent(e.target.value || null)}
              aria-label="Filter by student"
            >
              <option value="">All Students</option>
              {students.map(student => (
                <option key={student} value={student}>
                  {student}
                </option>
              ))}
            </select>
            {selectedStudent && (
              <button 
                onClick={() => handleDeleteStudent(selectedStudent)}
                className="delete-student-button"
              >
                Delete All for {selectedStudent}
              </button>
            )}
          </div>

          <div className="detailed-results">
            <HistoryTable 
              attempts={selectedStudent 
                ? attempts.filter(a => a.studentId === selectedStudent)
                : attempts
              }
              phrases={PHRASES}
              showStudentColumn={!selectedStudent}
              onDeleteAttempt={handleDeleteAttempt}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherDashboard;