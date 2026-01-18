import React, { useState, useEffect } from 'react';
import { getPhraseSetById } from '../storage';
import { storeComprehensionResult } from '../lib/store_results'; // Porting utility
import './Reading_Question_Interface.css';

interface Props {
  studentId: string;
  selectedSetId: string;
  onSessionComplete: () => void;
}

const ReadingQuestionInterface: React.FC<Props> = ({ studentId, selectedSetId, onSessionComplete }) => {
  const [passage, setPassage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const data = await getPhraseSetById(selectedSetId);
      
      // Drilling into the virtual set structure: PhraseSet -> phrases[0]
      if (data && data.phrases && data.phrases.length > 0) {
        const targetContent = data.phrases[0];
        
        if (targetContent.questions && targetContent.questions.length > 0) {
          setPassage(targetContent); 
        } else {
          console.error("Set found, but questions array is missing inside phrases[0]");
        }
      }
      setLoading(false);
    };
    loadData();
  }, [selectedSetId]);

  const handleAnswerSelection = async (selectedOption: string) => {
    const currentQuestion = passage.questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    
    // Track current score
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);

    if (currentQuestionIndex < passage.questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // LAST QUESTION: Port the results to the specialized results porter
      await storeComprehensionResult(
        studentId,
        passage.id,
        passage.title || "Comprehension Passage",
        newScore,
        passage.questions.length
      );

      alert(`Quiz Complete! You got ${newScore}/${passage.questions.length} correct.`);
      onSessionComplete();
    }
  };

  if (loading) return <div className="loading">Loading questions...</div>;
  
  if (!passage || !passage.questions || passage.questions.length === 0) {
    return (
      <div className="error">
        <p>No questions found for this set.</p>
        <button onClick={onSessionComplete} className="back-btn">Go Back</button>
      </div>
    );
  }

  const currentQuestion = passage.questions[currentQuestionIndex];

  return (
    <div className="comprehension-interface">
      <div className="passage-card">
        <h2>{passage.title || "Reading Passage"}</h2>
        <p className="passage-text">{passage.text}</p>
      </div>

      <div className="question-card">
        <div className="quiz-progress">
          Question {currentQuestionIndex + 1} of {passage.questions.length}
        </div>
        
        <h3 className="question-text">{currentQuestion.question}</h3>
        
        <div className="options-grid">
          {Object.entries(currentQuestion.options).map(([key, value]) => (
            <button 
              key={key} 
              className="option-button"
              onClick={() => handleAnswerSelection(key)}
            >
              <span className="option-label">{key.toUpperCase()}</span>
              {value as string}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReadingQuestionInterface;