import React from 'react';
import { FaMicrophone, FaStop, FaCircle } from 'react-icons/fa';

interface RecordingControlsProps {
  listening: boolean;
  startTime: number | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  listening,
  startTime,
  onStartRecording,
  onStopRecording
}) => {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="recording-controls-container">
      <div className="recording-buttons">
        <button 
          onClick={onStartRecording} 
          disabled={listening}
          className={`record-button ${listening ? 'active' : ''}`}
          aria-label={listening ? 'Recording in progress' : 'Start recording'}
        >
          {listening ? (
            <>
              <FaCircle className="pulse-icon" />
              <span>Recording</span>
            </>
          ) : (
            <>
              <FaMicrophone />
              <span>Start Recording</span>
            </>
          )}
        </button>
        
        <button
          onClick={onStopRecording}
          disabled={!listening}
          className="stop-button"
          aria-label="Stop recording"
        >
          <FaStop />
          <span>Stop</span>
        </button>
      </div>

      {listening && startTime && (
        <div className="recording-timer">
          <span className="timer-label">Time:</span>
          <span className="timer-value">
            {formatTime(Date.now() - startTime)}
          </span>
        </div>
      )}
    </div>
  );
};

export default RecordingControls;