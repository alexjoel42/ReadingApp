import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { saveAttempt, getAttemptHistory, getStudentProgress, recordAttempt } from './storage';
import StudentIdForm from './components/StudentIdForm';
import TeacherDashboard from './components/TeacherDashboard';
import type { Attempt } from './model';
import './App.css';
import type { Phrase } from './constants/phrases';
import { PHRASE_SETS } from './constants/phrases';
import { evaluatePronunciation } from './lib/pronunciationEvaluator';
import PhraseCard from './practice/PhraseCard';
import RecordingControls from './practice/ReadingControls.tsx'; // Adjust this path if necessary


const App: React.FC = () => {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  
  // Speech recognition hook remains in App.tsx since it's used across components
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    setAttempts(getAttemptHistory());
  }, []);

  if (!browserSupportsSpeechRecognition) {
    return <div className="error">Your browser doesn't support speech recognition.</div>;
  }

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <Link to="/" className="app-logo">Reading Coach</Link>
          <Link to="/history" className="teacher-link">Teacher Dashboard</Link>
          {studentId && <span className="student-badge">Student: {studentId}</span>}
        </header>

        <Routes>
          <Route path="/" element={
            !studentId ? (
              <StudentIdForm onStudentIdSet={setStudentId} />
            ) : (
              <PracticeSession 
                studentId={studentId}
                transcript={transcript}
                listening={listening}
                resetTranscript={resetTranscript}
                onSessionComplete={() => setStudentId(null)}
                onAttemptRecorded={(newAttempt) => setAttempts(prev => [newAttempt, ...prev])}
              />
            )
          } />

          <Route path="/history" element={
            <TeacherDashboard 
              attempts={attempts} 
              onAttemptsUpdate={() => setAttempts(getAttemptHistory())} 
            />
          } />
        </Routes>
      </div>
    </Router>
  );
};

// PracticeSession component moved inside App.tsx for AI readability
interface PracticeSessionProps {
  studentId: string;
  transcript: string;
  listening: boolean;
  resetTranscript: () => void;
  onSessionComplete: () => void;
  onAttemptRecorded: (attempt: Attempt) => void;
}

const PracticeSession: React.FC<PracticeSessionProps> = ({
  studentId,
  transcript,
  listening,
  resetTranscript,
  onSessionComplete,
  onAttemptRecorded
}) => {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [completedPhrases, setCompletedPhrases] = useState<Set<string>>(new Set());
  const [lastEvaluation, setLastEvaluation] = useState<ReturnType<typeof evaluatePronunciation> | null>(null);
  const [currentPhrases, setCurrentPhrases] = useState<Phrase[]>([]);

  // Get assessment set based on student progress
  const getAssessmentSet = (studentId: string) => {
    const progress = getStudentProgress(studentId);
    const currentSet = PHRASE_SETS[progress.currentSet].phrases;
    
    return [...currentSet]
      .sort(() => 0.5 - Math.random())
      .slice(0, 10);
  };

  useEffect(() => {
    const phrases = getAssessmentSet(studentId);
    setCurrentPhrases(phrases);
    setCurrentPhraseIndex(0);
    setCompletedPhrases(new Set());
    resetTranscript();
    setLastEvaluation(null);
  }, [studentId, resetTranscript]);

  const handleStartRecording = () => {
    if (currentPhrases.length === 0 || listening) return;
    resetTranscript();
    setLastEvaluation(null);
    setStartTime(Date.now());
    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
  };

  const handleStopRecording = () => {
    if (!startTime || currentPhrases.length === 0 || !listening) return;

    SpeechRecognition.stopListening();
    const durationMs = Date.now() - startTime;
    const currentPhrase = currentPhrases[currentPhraseIndex];

    const evaluation = evaluatePronunciation(currentPhrase, transcript);
    setLastEvaluation(evaluation);

    const newAttempt: Attempt = {
      studentId,
      phraseId: currentPhrase.id,
      timestamp: new Date(),
      durationMs,
      targetPhrase: currentPhrase.text,
      attemptedPhrase: transcript,
      accuracy: evaluation.score.overall,
      sightWordScore: evaluation.score.sightWords,
      phoneticScore: evaluation.score.phoneticPatterns,
      feedback: evaluation.feedback,
      details: evaluation.details,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    saveAttempt(newAttempt);
    recordAttempt(
      studentId,
      currentPhrase.id,
      evaluation.score.overall,
      transcript,
      durationMs
    );
    onAttemptRecorded(newAttempt);
    setStartTime(null);
  };

  const handleNextPhrase = () => {
    if (currentPhrases.length === 0 || listening) return;
    
    const updatedCompleted = new Set(completedPhrases).add(currentPhrases[currentPhraseIndex].id);
    setCompletedPhrases(updatedCompleted);

    if (updatedCompleted.size >= currentPhrases.length) {
      onSessionComplete();
      return;
    }

    let nextIndex = currentPhraseIndex;
    do {
      nextIndex = (nextIndex + 1) % currentPhrases.length;
    } while (updatedCompleted.has(currentPhrases[nextIndex].id));

    setCurrentPhraseIndex(nextIndex);
    resetTranscript();
    setLastEvaluation(null);
  };

  if (currentPhrases.length === 0) {
    return <div className="loading-message">Loading assessment phrases...</div>;
  }

  return (
    <div className="practice-interface">
      <PhraseCard 
        phrase={currentPhrases[currentPhraseIndex]}
        currentIndex={currentPhraseIndex}
        totalPhrases={currentPhrases.length}
      />
      
      <RecordingControls 
        listening={listening}
        startTime={startTime}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
      />

      {transcript && (
        <div className="attempt-result">
          <h3>Your attempt:</h3>
          <p className="attempted-phrase">"{transcript}"</p>
          
          {lastEvaluation && (
            <div className="analysis-results">
              <h4>Analysis:</h4>
              <div className="feedback-message">{lastEvaluation.feedback}</div>
              
              <div className="score-breakdown">
                <div className="score-meter">
                  <span>Overall Accuracy: </span>
                  <div className="meter-container">
                    <div 
                      className="meter-fill overall" 
                      style={{ width: `${lastEvaluation.score.overall}%` }}
                    />
                    <span className="score-value">{lastEvaluation.score.overall}%</span>
                  </div>
                </div>
                
                <div className="score-meter">
                  <span>Sight Words: </span>
                  <div className="meter-container">
                    <div 
                      className="meter-fill sight-words" 
                      style={{ width: `${lastEvaluation.score.sightWords}%` }}
                    />
                    <span className="score-value">{lastEvaluation.score.sightWords}%</span>
                  </div>
                </div>
                
                <div className="score-meter">
                  <span>Phonetics: </span>
                  <div className="meter-container">
                    <div 
                      className="meter-fill phonetics" 
                      style={{ width: `${lastEvaluation.score.phoneticPatterns}%` }}
                    />
                    <span className="score-value">{lastEvaluation.score.phoneticPatterns}%</span>
                  </div>
                </div>
              </div>

              {lastEvaluation.details.missingWords.length > 0 && (
                <div className="error-section missing-words">
                  <h5>Missing Words:</h5>
                  <div className="word-list">
                    {lastEvaluation.details.missingWords.map((word, i) => (
                      <span key={i} className="error-word">{word}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {lastEvaluation.details.mispronouncedWords.length > 0 && (
                <div className="error-section mispronounced-words">
                  <h5>Mispronounced Words:</h5>
                  <ul>
                    {lastEvaluation.details.mispronouncedWords.map((item, i) => (
                      <li key={i}>
                        <strong>{item.word}</strong> → <span className="attempted">{item.attempted}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="navigation-controls">
        <button 
          onClick={handleNextPhrase}
          disabled={listening}
          className={`next-button ${completedPhrases.size >= currentPhrases.length - 1 ? 'complete-button' : ''}`}
        >
          {completedPhrases.size >= currentPhrases.length - 1 
            ? "Complete Session" 
            : "Next Phrase"}
        </button>
      </div>
    </div>
  );
};

export default App;