import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
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
  