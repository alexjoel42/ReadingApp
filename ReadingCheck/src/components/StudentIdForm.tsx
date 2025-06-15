// src/components/StudentIdForm.tsx
import React, { useState } from 'react';

interface StudentIdFormProps {
  onStudentIdSet: (id: string) => void;
}

const StudentIdForm: React.FC<StudentIdFormProps> = ({ onStudentIdSet }) => {
  const [studentId, setStudentId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId.trim()) {
      onStudentIdSet(studentId.trim());
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
        <button type="submit" className="submit-button">
          Start Practice Session
        </button>
      </form>
    </div>
  );
};

export default StudentIdForm;