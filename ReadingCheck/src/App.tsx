// src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { saveAttempt, getAttemptHistory, getStudentProgress, recordAttempt } from './storage';
import StudentIdForm from './components/StudentIdForm';
import TeacherDashboard from './components/TeacherDashboard';
import type { Attempt } from './model';
import './App.css';
import { PHRASE_SETS } from './constants/phrases';
import { evaluatePronunciation } from './lib/pronunciationEvaluator';

const App: React.FC = () => {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [completedPhrases, setCompletedPhrases] = useState<Set<string>>(new Set());
  const [lastEvaluation, setLastEvaluation] = useState<ReturnType<typeof evaluatePronunciation> | null>(null);
  const [currentPhrases, setCurrentPhrases] = useState<Phrase[]>([]);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    setAttempts(getAttemptHistory());
  }, []);

  const getAssessmentSet = (studentId: string) => {
    const progress = getStudentProgress(studentId);
    const currentSet = PHRASE_SETS[progress.currentSet].phrases;
    
    return [...currentSet]
      .sort(() => 0.5 - Math.random())
      .slice(0, 10);
  };

  useEffect(() => {
    if (studentId) {
      const phrases = getAssessmentSet(studentId);
      setCurrentPhrases(phrases);
      setCurrentPhraseIndex(0);
      setCompletedPhrases(new Set());
      resetTranscript();
      setLastEvaluation(null);
    }
  }, [studentId]);

  const handleStartRecording = () => {
    if (!studentId || currentPhrases.length === 0 || listening) return;
    resetTranscript();
    setLastEvaluation(null);
    setStartTime(Date.now());
    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
  };

  const handleStopRecording = () => {
    if (!startTime || !studentId || currentPhrases.length === 0 || !listening) return;

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
    recordAttempt(studentId, currentPhrase.id, evaluation.score.overall);
    setAttempts(prev => [newAttempt, ...prev]);
    setStartTime(null);
  };

  const handleNextPhrase = () => {
    if (currentPhrases.length === 0 || listening) return;
    
    const updatedCompleted = new Set(completedPhrases).add(currentPhrases[currentPhraseIndex].id);
    setCompletedPhrases(updatedCompleted);

    if (updatedCompleted.size >= currentPhrases.length) {
      setStudentId(null);
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
            ) : currentPhrases.length > 0 ? (
              <div className="practice-interface">
                <div className="phrase-card">
                  <h2>Phrase {currentPhraseIndex + 1} of {currentPhrases.length}</h2>
                  <p className="target-phrase">"{currentPhrases[currentPhraseIndex].text}"</p>
                  
                  {currentPhrases[currentPhraseIndex].sightWords?.length > 0 && (
                    <div className="sight-words">
                      <span>Sight Words: </span>
                      {currentPhrases[currentPhraseIndex].sightWords.map((word, i) => (
                        <span key={i} className="sight-word-tag">
                          {word}
                          {i < currentPhrases[currentPhraseIndex].sightWords.length - 1 ? ' ' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="recording-controls">
                  <button 
                    onClick={handleStartRecording} 
                    disabled={listening}
                    className={`record-button ${listening ? 'recording' : ''}`}
                  >
                    {listening ? (
                      <>
                        <span className="pulse-dot">●</span> Recording...
                      </>
                    ) : 'Start Recording'}
                  </button>
                  <button
                    onClick={handleStopRecording}
                    disabled={!listening}
                    className="stop-button"
                  >
                    Stop Recording
                  </button>
                </div>

                {listening && startTime && (
                  <div className="timer">
                    Recording: {((Date.now() - startTime) / 1000).toFixed(1)}s
                  </div>
                )}

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
            ) : (
              <div className="loading-message">Loading assessment phrases...</div>
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

export default App;