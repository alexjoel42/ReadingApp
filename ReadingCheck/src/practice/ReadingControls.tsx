import React from 'react';

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
  return (
    <>
      <div className="recording-controls">
        <button 
          onClick={onStartRecording} 
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
          onClick={onStopRecording}
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
    </>
  );
};

export default RecordingControls;