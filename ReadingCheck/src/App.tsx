import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { saveAttempt, getAttemptHistory, recordAttempt, getStudentProgress } from './storage';
import StudentIdForm from './components/StudentIdForm';
import TeacherDashboard from './components/TeacherDashboard';
import type { Attempt } from './model';
import './App.css';
import type { Phrase } from './constants/phrases';
import { PHRASE_SETS } from './constants/phrases';
import { evaluatePronunciation } from './lib/pronunciationEvaluator';
import PhraseCard from './practice/PhraseCard';
import RecordingControls from './practice/ReadingControls';

interface StudentData {
  id: string;
  level: number; // 1 = K, 2 = G1, 3 = G2
}

const App: React.FC = () => {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

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
    return <div className="error">Your browser doesn't support speech recognition. Please try Chrome or Edge.</div>;
  }

  return (
    <Router basename="/">
      <div className="app">
        <header className="app-header">
          <Link to="/" className="app-logo">ReadingFoundation</Link>
          <Link to="/history" className="teacher-link">Teacher Dashboard</Link>
          <Link to="https://word-snake-sight-words.vercel.app/" className="Game">Practice Game</Link>
          {studentData?.id && <span className="student-badge">Student: {studentData.id}</span>}
        </header>

        <Routes>
          <Route path="/" element={
            !studentData ? (
              <StudentIdForm onStudentDataSet={setStudentData} />
            ) : (
              <PracticeSession
                studentId={studentData.id}
                level={studentData.level}
                transcript={transcript}
                listening={listening}
                resetTranscript={resetTranscript}
                onSessionComplete={() => setStudentData(null)}
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

// ==============================================
// PRACTICE SESSION COMPONENT
// (could later move to practice/PracticeSession.tsx)
// ==============================================
interface PracticeSessionProps {
  studentId: string;
  level: number;
  transcript: string;
  listening: boolean;
  resetTranscript: () => void;
  onSessionComplete: () => void;
  onAttemptRecorded: (attempt: Attempt) => void;
}

const PracticeSession: React.FC<PracticeSessionProps> = ({
  studentId,
  level,
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
  const [recordingError, setRecordingError] = useState<string | null>(null);

  // ==============================================
  // PHRASE SELECTION SERVICE
  // (could later move to services/phraseService.ts)
  // ==============================================
  const getAssessmentSet = (level: number, studentId: string): Phrase[] => {
    const levelIndex = Math.min(Math.max(level - 1, 0), PHRASE_SETS.length - 1);
    const phrases = PHRASE_SETS[levelIndex].phrases;

    // Seed shuffle with studentId so order is consistent
    let seed = studentId.split('').reduce((acc, char) => {
      return (acc << 5) - acc + char.charCodeAt(0);
    }, 0);

    const seededPhrases = [...phrases];
    for (let i = seededPhrases.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const rand = seed / 233280;
      const j = Math.floor(rand * (i + 1));
      [seededPhrases[i], seededPhrases[j]] = [seededPhrases[j], seededPhrases[i]];
    }

    return seededPhrases.slice(0, 10); // first 10 for consistent set
  };

  useEffect(() => {
    const phrases = getAssessmentSet(level, studentId);
    setCurrentPhrases(phrases);
    setCurrentPhraseIndex(0);
    setCompletedPhrases(new Set());
    resetTranscript();
    setLastEvaluation(null);
    setRecordingError(null);

    // (Future) could use getStudentProgress(studentId) here to auto-adjust level
    console.log("Student progress:", getStudentProgress(studentId));
  }, [studentId, level, resetTranscript]);

  // ==============================================
  // RECORDING HANDLERS
  // (could later move to practice/recordingHandlers.ts)
  // ==============================================
  const handleStartRecording = async () => {
    setRecordingError(null);

    if (currentPhrases.length === 0) {
      setRecordingError('Cannot start recording: No phrases loaded yet.');
      return;
    }
    if (listening) return;

    resetTranscript();
    setLastEvaluation(null);
    setStartTime(Date.now());

    try {
      await SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
    } catch (error: any) {
      let errorMessage = 'Failed to start recording. Please check your microphone.';
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow microphone access.';
        } else if (error.name === 'AbortError' || error.name === 'SecurityError') {
          errorMessage = 'Recording was stopped or blocked. Try reloading.';
        }
      }
      setRecordingError(errorMessage);
      setStartTime(null);
    }
  };

  const handleStopRecording = () => {
    if (!startTime || currentPhrases.length === 0 || !listening) return;

    try {
      SpeechRecognition.stopListening();
    } catch {
      setRecordingError('Failed to stop recording cleanly.');
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
    recordAttempt(studentId, currentPhrase.id, evaluation.score.overall, transcript, durationMs);
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
    setRecordingError(null);
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
          <p>Please ensure your microphone is connected and allowed.</p>
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
              {/* Additional scoring display could go here */}
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
