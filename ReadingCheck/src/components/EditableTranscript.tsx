import React, { useState, useRef, useEffect } from 'react';
import './EditableTranscript.css';

interface EditableTranscriptProps {
  transcript: string;
  onTranscriptChange: (newTranscript: string) => void;
}

const EditableTranscript: React.FC<EditableTranscriptProps> = ({
  transcript,
  onTranscriptChange
}) => {
  const [words, setWords] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editedIndices, setEditedIndices] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse transcript into words whenever it changes
  useEffect(() => {
    if (transcript) {
      const parsed = transcript.split(/\s+/).filter(word => word.length > 0);
      setWords(parsed);
      setEditedIndices(new Set()); // Reset edited state on new transcript
    } else {
      setWords([]);
      setEditedIndices(new Set());
    }
  }, [transcript]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIndex]);

  const handleWordClick = (index: number) => {
    setEditingIndex(index);
    setEditValue(words[index]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleInputBlur = () => {
    commitEdit();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const commitEdit = () => {
    if (editingIndex === null) return;

    const trimmedValue = editValue.trim();
    
    // Only update if the value actually changed
    if (trimmedValue && trimmedValue !== words[editingIndex]) {
      const newWords = [...words];
      newWords[editingIndex] = trimmedValue;
      setWords(newWords);
      
      // Mark this index as edited
      const newEditedIndices = new Set(editedIndices);
      newEditedIndices.add(editingIndex);
      setEditedIndices(newEditedIndices);
      
      // Notify parent of the change with the FULL joined string
      const updatedTranscript = newWords.join(' ');
      console.log('EditableTranscript: Notifying parent with:', updatedTranscript);
      onTranscriptChange(updatedTranscript);
    }
    
    setEditingIndex(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  if (words.length === 0) {
    return null;
  }

  return (
    <div className="editable-transcript">
      <div className="transcript-words">
        {words.map((word, index) => (
          <React.Fragment key={index}>
            {editingIndex === index ? (
              <input
                ref={inputRef}
                type="text"
                className="word-input"
                value={editValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
              />
            ) : (
              <span
                className={`word ${editedIndices.has(index) ? 'edited' : ''}`}
                onClick={() => handleWordClick(index)}
              >
                {word}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
      <p className="edit-hint">Click any word to edit it</p>
    </div>
  );
};

export default EditableTranscript;