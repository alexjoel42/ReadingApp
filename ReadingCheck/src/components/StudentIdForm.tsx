// src/components/StudentIdForm.tsx
import React, { useState, useEffect } from 'react';
import { getAllPhraseSets } from '../storage';
import type { PhraseSet } from '../constants/phrases';

interface StudentIdFormProps {
  onStudentDataSet: (data: { id: string; selectedSetId: string }) => void;
}

const StudentIdForm: React.FC<StudentIdFormProps> = ({ onStudentDataSet }) => {
  const [studentId, setStudentId] = useState('');
  const [selectedSetId, setSelectedSetId] = useState('');
  const [phraseSets, setPhraseSets] = useState<PhraseSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load all phrase sets (static + imported)
    const loadSets = async () => {
      const sets = await getAllPhraseSets();
      setPhraseSets(sets);
      if (sets.length > 0 && !selectedSetId) {
        setSelectedSetId(sets[0].id);
      }
      setLoading(false);
    };
    
    loadSets();
    
    // Refresh every 2 seconds to catch new uploads
    const interval = setInterval(loadSets, 2000);
    return () => clearInterval(interval);
  }, [selectedSetId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId.trim() && selectedSetId) {
      onStudentDataSet({
        id: studentId.trim(),
        selectedSetId
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
    <form className="student-form" onSubmit={handleSubmit}>
      <h2>Reading Practice</h2>
      
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

      <button type="submit" className="start-button">
        Start Practice
      </button>
    </form>
  );
};

export default StudentIdForm;