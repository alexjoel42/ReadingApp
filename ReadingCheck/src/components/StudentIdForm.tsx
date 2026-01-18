import React, { useState, useEffect } from 'react';
import { getAllPhraseSets } from '../storage';
import type { PhraseSet } from '../constants/phrases';

// Define the session modes
export type SessionMode = 'fluency' | 'comprehension';

interface StudentIdFormProps {
  // Updated to include 'mode' in the returned data
  onStudentDataSet: (data: { id: string; selectedSetId: string; mode: SessionMode }) => void;
}

const StudentIdForm: React.FC<StudentIdFormProps> = ({ onStudentDataSet }) => {
  const [studentId, setStudentId] = useState('');
  const [selectedSetId, setSelectedSetId] = useState('');
  const [phraseSets, setPhraseSets] = useState<PhraseSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSets = async () => {
      const sets = await getAllPhraseSets();
      // Map sets to ensure sightWords is always a mutable array
      const normalizedSets = sets.map((set) => ({
        ...set,
        phrases: set.phrases.map((phrase: any) => ({
          ...phrase,
          sightWords: Array.isArray(phrase.sightWords)
            ? Array.from(phrase.sightWords)
            : [],
        })),
      }));
      setPhraseSets(normalizedSets);
      if (normalizedSets.length > 0 && !selectedSetId) {
        setSelectedSetId(normalizedSets[0].id);
      }
      setLoading(false);
    };
    
    loadSets();
    const interval = setInterval(loadSets, 2000);
    return () => clearInterval(interval);
  }, [selectedSetId]);

  // Unified submit handler that takes the mode as an argument
  const handleStart = (e: React.FormEvent, mode: SessionMode) => {
    e.preventDefault();
    if (studentId.trim() && selectedSetId) {
      onStudentDataSet({
        id: studentId.trim(),
        selectedSetId,
        mode
      });
    }
  };

  if (loading) {
    return (
      <div className="student-form">
        <p>Loading phrase sets...</p>
      </div>
    );
  }

  return (
    <form className="student-form">
      <h2>Reading Foundation</h2>
      
      <div className="form-group">
        <label htmlFor="studentId">Student Name:</label>
        <input
          id="studentId"
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="Enter your name"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="phraseSet">Practice Set:</label>
        <select
          id="phraseSet"
          value={selectedSetId}
          onChange={(e) => setSelectedSetId(e.target.value)}
          required
        >
          {phraseSets.map((set) => (
            <option key={set.id} value={set.id}>
              {set.focus}
            </option>
          ))}
        </select>
      </div>

      <div className="button-actions" style={{ display: 'flex', gap: '1rem', marginTop: '20px' }}>
        <button 
          type="button" 
          className="start-button fluency-btn"
          onClick={(e) => handleStart(e, 'fluency')}
        >
          Start Reading Practice
        </button>

        <button 
          type="button" 
          className="start-button comprehension-btn"
          style={{ backgroundColor: '#28a745' }}
          onClick={(e) => handleStart(e, 'comprehension')}
        >
          Start Comprehension
        </button>
      </div>
    </form>
  );
};

export default StudentIdForm;