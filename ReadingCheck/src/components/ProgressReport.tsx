import { getStudentProgress } from '../storage';
import { PHRASE_SETS } from '../constants/phrases';

interface ProgressReportProps {
  studentId: string;
}

interface StudentProgress {
  currentSet: number;
  completedPhrases: Record<string, {
    mastered: boolean;
    lastAccuracy: number;
    attempts: number;
  }>;
}

export const ProgressReport = ({ studentId }: ProgressReportProps) => {
  const progress = getStudentProgress(studentId);
  const currentSet = PHRASE_SETS[progress.currentSet];
  
  const calculateMasteryPercent = (progress: StudentProgress): number => {
    const currentPhrases = PHRASE_SETS[progress.currentSet].phrases;
    const masteredCount = currentPhrases.reduce((count, phrase) => {
      const phraseRecord = progress.completedPhrases[phrase.id];
      return count + (phraseRecord?.mastered ? 1 : 0);
    }, 0);
    return currentPhrases.length > 0 ? Math.round((masteredCount / currentPhrases.length) * 100) : 0;
  };

  const getPhraseText = (phraseId: string): string => {
    const allPhrases: { id: string; text: string }[] = PHRASE_SETS.flatMap(set =>
      set.phrases.map((phrase: any) => ({ id: phrase.id, text: phrase.text }))
    );
    const phrase = allPhrases.find((p) => p.id === phraseId);
    return phrase?.text || 'Unknown phrase';
  };

  return (
    <div className="progress-report">
      <h3>Reading Progress: {studentId}</h3>
      
      <div className="set-progress">
        <h4>Current Focus: Set {progress.currentSet + 1}</h4>
        <p>Phonics: {currentSet.focus}</p>
        
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${calculateMasteryPercent(progress)}%` }}
          >
            {calculateMasteryPercent(progress)}% Mastered
          </div>
        </div>
      </div>
      
      <div className="recent-phrases">
        <h4>Recently Practiced</h4>
        <ul>
          {Object.entries(progress.completedPhrases)
            .sort(([, a], [, b]) => b.attempts - a.attempts)
            .slice(0, 5)
            .map(([phraseId, record]) => (
              <li key={phraseId}>
                {getPhraseText(phraseId)}: 
                <span className={record.mastered ? 'mastered' : 'practicing'}>
                  {record.lastAccuracy}% ({record.attempts} tries)
                </span>
              </li>
          ))}
        </ul>
      </div>
    </div>
  );
};