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

// Safe migration helper - runs after database is open
const DB_VERSION_KEY = 'readingapp_db_version';

async function runMigrationIfNeeded() {
  if (typeof window === 'undefined') return;
  
  const currentVersion = localStorage.getItem(DB_VERSION_KEY);
  
  // If already on version 4, no migration needed
  if (currentVersion === '4') return;
  
  console.log('🔄 Running database migration to version 4...');
  
  try {
    // Database is already open and ready to use
    // If you need to migrate old data, do it here
    // For now, we just mark as migrated
    
    localStorage.setItem(DB_VERSION_KEY, '4');
    console.log('✅ Database migration complete');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration after database is ready
if (typeof window !== 'undefined') {
  db.open().then(() => {
    runMigrationIfNeeded();
  });
}