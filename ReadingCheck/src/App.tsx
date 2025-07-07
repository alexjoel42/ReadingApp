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
import RecordingControls from './practice/ReadingControls';


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
    // This is already a good message for basic support
    return <div className="error">Your browser doesn't support speech recognition. Please try Chrome or Edge.</div>;
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

  // State to hold potential error messages for the user
  const [recordingError, setRecordingError] = useState<string | null>(null);


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
    setRecordingError(null); // Clear error on new session/phrase set
  }, [studentId, resetTranscript]);

  const handleStartRecording = async () => { // Make it async to handle promises from SpeechRecognition.startListening
    setRecordingError(null); // Clear any previous error messages

    if (currentPhrases.length === 0) {
      console.error('Recording Error: No phrases loaded to practice.');
      setRecordingError('Cannot start recording: No phrases loaded yet.');
      return;
    }
    if (listening) {
      console.warn('Recording Warning: Already listening, ignoring start request.');
      // No need to set an error, but good to log for debugging
      return;
    }

    resetTranscript();
    setLastEvaluation(null);
    setStartTime(Date.now());
    
    console.log('Attempting to start recording...');
    try {
      // SpeechRecognition.startListening can return a Promise,
      // or simply initiate the process. A try/catch is good practice.
      await SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
      console.log('Speech recognition started successfully.');
    } catch (error: any) { // Catching 'any' is common for browser APIs that might throw various error types
      console.error('Failed to start speech recognition:', error);

      let errorMessage = 'Failed to start recording. Please check your microphone.';

      // Check for common error types/messages
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
        } else if (error.name === 'AbortError' || error.name === 'SecurityError') {
          errorMessage = 'Recording was stopped or blocked. Ensure no other applications are using the microphone, or try reloading.';
        } else if (error.name === 'NetworkError') {
          errorMessage = 'A network error occurred during speech recognition. Check your internet connection.';
        }
        // Other DOMException names exist, but these are most common for media issues
      } else if (error && typeof error.message === 'string' && error.message.includes('permission')) {
          errorMessage = 'Microphone permission required. Please grant access in your browser.';
      }
      // General fallback for unknown errors
      else {
        errorMessage += ` (Error: ${error.message || 'Unknown error'})`;
      }
      
      setRecordingError(errorMessage);
      setStartTime(null); // Reset start time if recording failed to start
    }
  };

  const handleStopRecording = () => {
    if (!startTime || currentPhrases.length === 0) {
      console.warn('Recording Warning: Attempted to stop recording when not active or no phrases loaded.');
      return;
    }
    if (!listening) {
        console.warn('Recording Warning: Attempted to stop recording, but speech recognition was not active.');
        // This can happen if startListening failed silently or was interrupted
        setStartTime(null); // Ensure startTime is null if listening isn't true
        setRecordingError('Recording was not active or was interrupted. Please try again.');
        return;
    }

    try {
        SpeechRecognition.stopListening();
        console.log('Speech recognition stopped successfully.');
    } catch (error: any) {
        console.error('Failed to stop speech recognition:', error);
        setRecordingError('Failed to stop recording cleanly. Please reload the page if issues persist.');
        // Don't return here, still attempt to process transcript if any
    }
   
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
    setRecordingError(null); // Clear error when moving to next phrase
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

      {recordingError && (
        <div className="error-message">
          <p>{recordingError}</p>
          <p>Please ensure your microphone is connected and allowed by the browser.</p>
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
  );
};

export default App;