import { describe, it } from 'vitest';
import { render} from '@testing-library/react';
import PhraseCard from './PhraseCard';

describe('PhraseCard', () => {
  const mockPhrase = {
    id: '1',
    text: 'The quick brown fox',
    sightWords: ['the', 'quick'],
    phoneticPatterns: ['kw', 'br'],
  };

    it('renders without crashing', () => {
      render(<PhraseCard phrase={mockPhrase} currentIndex={0} totalPhrases={1} />);
    });
  });
  