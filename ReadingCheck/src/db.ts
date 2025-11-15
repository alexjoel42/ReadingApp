// src/db.ts
import Dexie, { type Table } from 'dexie';
import type { Attempt } from './model';
import type { PhraseSet } from './constants/phrases';

export interface StudentProgress {
  id: string; // studentId
  currentSet: number;
  currentSetId: string; // Add this to track the actual set ID
  completedPhrases: {
    [phraseId: string]: {
      attemptedPhrase: string;
      attempts: number;
      lastAccuracy: number;
      mastered: boolean;
      durationMs: number;
      timestamp: string;
      setId: string; // Track which set this phrase belongs to
    };
  };
}

export interface AttemptWithDetails extends Attempt {
  setId: string; // Add set ID to attempts for better tracking
}

export class ReadingAppDB extends Dexie {
  attempts!: Table<AttemptWithDetails, string>;
  progress!: Table<StudentProgress, string>;
  phraseSets!: Table<PhraseSet, string>;

  constructor() {
    super('ReadingAppDB');
    
    this.version(4).stores({
      attempts: 'id, studentId, timestamp, setId',
      progress: 'id',
      phraseSets: 'id'
    });
  }
}

export const db = new ReadingAppDB();

// Migration helper
if (typeof window !== 'undefined') {
  const DB_VERSION_KEY = 'readingapp_db_version';
  const currentVersion = localStorage.getItem(DB_VERSION_KEY);
  
  if (currentVersion !== '4') {
    console.log('🔄 Upgrading database schema to version 4...');
    db.delete().then(() => {
      localStorage.setItem(DB_VERSION_KEY, '4');
      console.log('✅ Database schema upgraded to version 4');
    });
  }
}