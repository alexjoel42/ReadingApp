import React from 'react';
import type { Phrase } from '../constants/phrases';

interface PhraseCardProps {
  phrase: Phrase;
  currentIndex: number;
  totalPhrases: number;
}

const PhraseCard: React.FC<PhraseCardProps> = ({ 
  phrase, 
  currentIndex, 
  totalPhrases 
}) => {
  return (
    <div className="phrase-card">
      <h2>Phrase {currentIndex + 1} of {totalPhrases}</h2>
      <p className="target-phrase">"{phrase.text}"</p>
      
      {phrase.sightWords?.length > 0 && (
        <div className="sight-words">
          <span>Sight Words: </span>
          {phrase.sightWords.map((word, i) => (
            <span key={i} className="sight-word-tag">
              {word}
              {i < phrase.sightWords.length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhraseCard;