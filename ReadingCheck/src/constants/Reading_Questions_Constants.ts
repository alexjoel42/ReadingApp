export interface ComprehensionQuestion {
  id: string;
  question: string;
  options: { a: string; b: string; c: string; d: string };
  correctAnswer: 'a' | 'b' | 'c' | 'd';
}

export interface Passage {
  id: string;
  title: string;
  text: string;
  questions: ComprehensionQuestion[];
}

export const FOURTH_GRADE_SAMPLE: Passage[] = [
  {
    id: 'passage_001',
    title: 'The Great Migration',
    text: 'Every winter, the monarch butterflies travel thousands of miles to Mexico. They land on the same trees their ancestors used, even though they have never been there before...',
    questions: [
      {
        id: 'q1',
        question: 'Why do the butterflies travel to Mexico?',
        options: {
          a: ' To find new types of flowers',
          b: ' To escape the winter cold',
          c: ' To meet other butterfly species',
          d: ' Because they are lost'
        },
        correctAnswer: 'b'
      }
    ]
  }
];