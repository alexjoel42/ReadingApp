import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { saveAttempt, getAttemptHistory, recordAttempt, getStudentProgress, getPhraseSetById } from './storage';
import StudentIdForm from './components/StudentIdForm';
import TeacherDashboard from './components/TeacherDashboard';
import PhraseImportTool from './Phrase_Loader/PhraseImportTool';
import EditableTranscript from './components/EditableTranscript';
import type { Attempt } from './model';
import type { Phrase } from './constants/phrases';
import { evaluatePronunciation } from './lib/pronunciationEvaluator';
import PhraseCard from './practice/PhraseCard';
import RecordingControls from './practice/ReadingControls';

// IMPORT: This is your new component for the comprehension logic
import ReadingQuestionInterface from './Reading_Comprehension/Reading_Question_Interface'; 
import './App.css';

// Updated interface to include the mode selected in StudentIdForm
interface StudentData {
  id: string;
  selectedSetId: string;
  mode: 'fluency' | 'comprehension';
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
          <Link to="/PhraseLoader" className="PhraseImportTool">Phrase Import Tool</Link>
          {studentData?.id && (
            <span className="student-badge">
              Student: {studentData.id} | {studentData.mode === 'fluency' ? '🗣️ Practice' : '🧠 Quiz'}
            </span>
          )}
        </header>

        <Routes>
          <Route path="/" element={
            !studentData ? (
              // StudentIdForm now returns { id, selectedSetId, mode }
              <StudentIdForm onStudentDataSet={setStudentData} />
            ) : studentData.mode === 'fluency' ? (
              /* FLOW 1: Standard Fluency Practice */
              <PracticeSession
                studentId={studentData.id}
                selectedSetId={studentData.selectedSetId}
                transcript={transcript}
                listening={listening}
                resetTranscript={resetTranscript}
                onSessionComplete={() => setStudentData(null)}
                onAttemptRecorded={(newAttempt) => setAttempts(prev => [newAttempt, ...prev])}
              />
            ) : (
              /* FLOW 2: Reading Comprehension */
              <ReadingQuestionInterface
                studentId={studentData.id}
                selectedSetId={studentData.selectedSetId}
                onSessionComplete={() => setStudentData(null)}
              />
            )
          } />

          <Route path="/history" element={
            <TeacherDashboard
              attempts={attempts}
              onAttemptsUpdate={() => setAttempts(getAttemptHistory())}
            />
          } />

          <Route path="/PhraseLoader" element={<PhraseImportTool />} />
        </Routes>
      </div>
    </Router>
  );
};

// ==============================================
// PracticeSession Component (Standard Fluency)
// ==============================================
interface PracticeSessionProps {
  studentId: string;
  selectedSetId: string;
  transcript: string;
  listening: boolean;
  resetTranscript: () => void;
  onSessionComplete: () => void;
  onAttemptRecorded: (attempt: Attempt) => void;
}

const PracticeSession: React.FC<PracticeSessionProps> = ({
  studentId,
  selectedSetId,
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
  const [editedTranscript, setEditedTranscript] = useState<string>('');
  const [recordingEndTime, setRecordingEndTime] = useState<number | null>(null);
  const [hasBeenEdited, setHasBeenEdited] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);

  const getAssessmentSet = async (selectedSetId: string, studentId: string): Promise<Phrase[]> => {
    const selectedSet = await getPhraseSetById(selectedSetId);
    
    if (!selectedSet) {
      console.warn(`Phrase set ${selectedSetId} not found`);
      return [];
    }

    const phrases = selectedSet.phrases;

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

    return seededPhrases.slice(0, 10);
  };

  useEffect(() => {
    const loadPhrases = async () => {
      const phrases = await getAssessmentSet(selectedSetId, studentId);
      setCurrentPhrases(phrases);
      setCurrentPhraseIndex(0);
      setCompletedPhrases(new Set());
      resetTranscript();
      setLastEvaluation(null);
      setRecordingError(null);
      setEditedTranscript('');

      console.log("Student progress:", getStudentProgress(studentId));
    };
    
    loadPhrases();
  }, [studentId, selectedSetId, resetTranscript]);

  useEffect(() => {
    if (!hasBeenEdited) {
      setEditedTranscript(transcript);
    }
  }, [transcript, hasBeenEdited]);

  const handleStartRecording = async () => {
    setRecordingError(null);
    if (currentPhrases.length === 0) {
      setRecordingError('Cannot start recording: No phrases loaded yet.');
      return;
    }
    if (listening || isWarmingUp) return;

    resetTranscript();
    setLastEvaluation(null);
    setEditedTranscript('');
    setHasBeenEdited(false);
    setRecordingEndTime(null);
    setIsWarmingUp(true);

    try {
      await SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
      
      setTimeout(() => {
        setStartTime(Date.now());
        setIsWarmingUp(false);
      }, 500);
      
    } catch (error: any) {
      let errorMessage = 'Failed to start recording. Please check your microphone.';
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow microphone access.';
        }
      }
      setRecordingError(errorMessage);
      setStartTime(null);
      setIsWarmingUp(false);
    }
  };

  const handleStopRecording = () => {
    if (!startTime || currentPhrases.length === 0 || !listening) return;
    try {
      SpeechRecognition.stopListening();
    } catch {
      setRecordingError('Failed to stop recording cleanly.');
    }
    setRecordingEndTime(Date.now());
  };

  const handleNextPhrase = async () => {
    if (currentPhrases.length === 0 || listening || isWarmingUp) return;

    if (editedTranscript && startTime && recordingEndTime) {
      const durationMs = recordingEndTime - startTime;
      const currentPhrase = currentPhrases[currentPhraseIndex];
      
      const evaluation = evaluatePronunciation(currentPhrase, editedTranscript);
      setLastEvaluation(evaluation);

      const newAttempt: Attempt = {
        studentId,
        phraseId: currentPhrase.id,
        timestamp: new Date(),
        durationMs,
        targetPhrase: currentPhrase.text,
        attemptedPhrase: editedTranscript,
        accuracy: evaluation.score.overall,
        sightWordScore: evaluation.score.sightWords,
        phoneticScore: evaluation.score.phoneticPatterns,
        feedback: evaluation.feedback,
        details: evaluation.details,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      saveAttempt(newAttempt);
      await recordAttempt(studentId, currentPhrase.id, evaluation.score.overall, editedTranscript, durationMs);
      onAttemptRecorded(newAttempt);
    }

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
    setEditedTranscript('');
    setHasBeenEdited(false);
    setStartTime(null);
    setRecordingEndTime(null);
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
        listening={listening || isWarmingUp}
        startTime={startTime}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
      />

      {recordingError && (
        <div className="error-message">
          <p>{recordingError}</p>
        </div>
      )}

      {editedTranscript && (
        <div className="attempt-result">
          <h3>Your attempt:</h3>
          <EditableTranscript
            transcript={editedTranscript}
            onTranscriptChange={(newTranscript) => {
              setEditedTranscript(newTranscript);
              setHasBeenEdited(true);
            }}
          />
        </div>
      )}

      <div className="navigation-controls">
        <button
          onClick={handleNextPhrase}
          disabled={listening || isWarmingUp}
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