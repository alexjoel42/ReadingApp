// src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { saveAttempt, getAttemptHistory } from './storage';
import StudentIdForm from './components/StudentIdForm';
import TeacherDashboard from './components/TeacherDashboard';
import type { Attempt } from './model';
import './App.css';
import { PHRASES } from './constants/phrases';
import { evaluatePronunciation } from './lib/pronunciationEvaluator';

const App: React.FC = () => {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [completedPhrases, setCompletedPhrases] = useState<Set<string>>(new Set());
  const [lastEvaluation, setLastEvaluation] = useState<ReturnType<typeof evaluatePronunciation> | null>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    setAttempts(getAttemptHistory());
  }, []);

  const handleStartRecording = () => {
    if (!studentId) return;
    resetTranscript();
    setLastEvaluation(null);
    setStartTime(Date.now());
    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
  };

  const handleStopRecording = () => {
    if (!startTime || !studentId) return;

    SpeechRecognition.stopListening();
    const durationMs = Date.now() - startTime;
    const currentPhrase = PHRASES[currentPhraseIndex];

    // NEW: Use the full phrase object for evaluation
    const evaluation = evaluatePronunciation(currentPhrase, transcript);
    setLastEvaluation(evaluation);

    const newAttempt: Attempt = {
      studentId,
      phraseId: currentPhrase.id,
      timestamp: new Date(),
      durationMs,
      targetPhrase: currentPhrase.text,
      attemptedPhrase: transcript,
      accuracy: evaluation.score.overall, // Use overall score from evaluation
      sightWordScore: evaluation.score.sightWords, // NEW: Track sight word score
      phoneticScore: evaluation.score.phoneticPatterns, // NEW: Track phonetic score
      feedback: evaluation.feedback,
      details: evaluation.details // NEW: Include all analysis details
      ,
      id: ''
    };

    saveAttempt(newAttempt);
    setAttempts(prev => [newAttempt, ...prev]);
    setStartTime(null);
  };

  const handleNextPhrase = () => {
    const updatedCompleted = new Set(completedPhrases).add(PHRASES[currentPhraseIndex].id);
    setCompletedPhrases(updatedCompleted);

    if (updatedCompleted.size >= PHRASES.length) {
      setStudentId(null);
      setCurrentPhraseIndex(0);
      setCompletedPhrases(new Set());
      return;
    }

    let nextIndex = currentPhraseIndex;
    do {
      nextIndex = (nextIndex + 1) % PHRASES.length;
    } while (updatedCompleted.has(PHRASES[nextIndex].id));

    setCurrentPhraseIndex(nextIndex);
    resetTranscript();
    setLastEvaluation(null);
  };

  if (!browserSupportsSpeechRecognition) {
    return <div className="error">Browser not supported</div>;
  }

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <Link to="/" className="app-logo">Speech Coach</Link>
          <Link to="/history" className="teacher-link">Teacher Dashboard</Link>
          {studentId && <span className="student-badge">Student: {studentId}</span>}
        </header>

        <Routes>
          <Route path="/" element={
            !studentId ? (
              <StudentIdForm onStudentIdSet={setStudentId} />
            ) : (
              <div className="practice-interface">
                <div className="phrase-card">
                  <h2>Phrase {currentPhraseIndex + 1} of {PHRASES.length}</h2>
                  <p className="target-phrase">"{PHRASES[currentPhraseIndex].text}"</p>
                  
                  {/* NEW: Display sight words for the phrase */}
                  {PHRASES[currentPhraseIndex].sightWords.length > 0 && (
                    <div className="sight-words">
                      <span>Sight Words: </span>
                      {PHRASES[currentPhraseIndex].sightWords.map((word, i) => (
                        <span key={i} className="sight-word-tag">
                          {word}
                          {i < PHRASES[currentPhraseIndex].sightWords.length - 1 ? ' ' : ''}
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
                    {listening ? '● Recording...' : 'Start Recording'}
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
                    Time: {((Date.now() - startTime) / 1000).toFixed(1)}s
                  </div>
                )}

                {transcript && (
                  <div className="attempt-result">
                    <h3>Your attempt:</h3>
                    <p>"{transcript}"</p>
                    
                    {lastEvaluation && (
                      <div className="analysis-results">
                        <h4>Analysis:</h4>
                        <p className="feedback">{lastEvaluation.feedback}</p>
                        
                        {/* Enhanced accuracy display */}
                        <div className="score-breakdown">
                          <div className="score-meter">
                            <span>Overall: </span>
                            <div className="meter-container">
                              <div 
                                className="meter-fill overall" 
                                style={{ width: `${lastEvaluation.score.overall}%` }}
                              />
                              <span>{lastEvaluation.score.overall}%</span>
                            </div>
                          </div>
                          
                          <div className="score-meter">
                            <span>Sight Words: </span>
                            <div className="meter-container">
                              <div 
                                className="meter-fill sight-words" 
                                style={{ width: `${lastEvaluation.score.sightWords}%` }}
                              />
                              <span>{lastEvaluation.score.sightWords}%</span>
                            </div>
                          </div>
                          
                          <div className="score-meter">
                            <span>Phonetics: </span>
                            <div className="meter-container">
                              <div 
                                className="meter-fill phonetics" 
                                style={{ width: `${lastEvaluation.score.phoneticPatterns}%` }}
                              />
                              <span>{lastEvaluation.score.phoneticPatterns}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced error details */}
                        <div className="error-details">
                          {lastEvaluation.details.missingWords.length > 0 && (
                            <div className="missing-words">
                              <h5>Missing Words:</h5>
                              <div>
                                {lastEvaluation.details.missingWords.map((word, i) => (
                                  <span key={i} className="error-word">{word}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {lastEvaluation.details.mispronouncedWords.length > 0 && (
                            <div className="mispronounced-words">
                              <h5>Mispronounced:</h5>
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
                      </div>
                    )}
                  </div>
                )}

                <div className="navigation">
                  <button 
                    onClick={handleNextPhrase}
                    disabled={listening}
                    className="next-button"
                  >
                    {completedPhrases.size >= PHRASES.length - 1 
                      ? "Complete Session" 
                      : "Next Phrase"}
                  </button>
                </div>
              </div>
            )
          } />

          <Route path="/history" element={
            <TeacherDashboard attempts={attempts} onAttemptsUpdate={function (): void {
              throw new Error('Function not implemented.');
            } } />
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;