// src/components/StudentIdForm.tsx
import React, { useState } from 'react';

interface StudentData {
  id: string;
  level: number; // 1 for k-set, 2 for g1-set, 3 for g2-set
}

interface StudentIdFormProps {
  onStudentDataSet: (data: StudentData) => void;
}

const StudentIdForm: React.FC<StudentIdFormProps> = ({ onStudentDataSet }) => {
  const [studentId, setStudentId] = useState('');
  const [level, setLevel] = useState<number>(1); // Default to Kindergarten

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId.trim()) {
      onStudentDataSet({
        id: studentId.trim(),
        level: level
      });
    }
  };

  return (
    <div className="student-form-container">
      <h2>Welcome to Speech Coach</h2>
      <form onSubmit={handleSubmit} className="student-form">
        <div className="form-group">
          <label htmlFor="studentId">Student ID:</label>
          <input
            id="studentId"
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
            pattern="[A-Za-z0-9]+"
            title="Letters and numbers only"
            placeholder="Enter your student ID"
          />
        </div>
        
        <div className="form-group">
          <label>Grade Level:</label>
          <div className="level-options">
            <label>
              <input
                type="radio"
                name="level"
                value="1"
                checked={level === 1}
                onChange={() => setLevel(1)}
              />
              Level 1
            </label>
            <label>
              <input
                type="radio"
                name="level"
                value="2"
                checked={level === 2}
                onChange={() => setLevel(2)}
              />
              Level 2
            </label>
            <label>
              <input
                type="radio"
                name="level"
                value="3"
                checked={level === 3}
                onChange={() => setLevel(3)}
              />
              Level 3
            </label>
          </div>
        </div>
        
        <button type="submit" className="submit-button">
          Start Practice Session
        </button>
      </form>
    </div>
  );
};

export default StudentIdForm;