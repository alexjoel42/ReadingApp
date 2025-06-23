import { getStudentProgress } from '../storage';
import { PHRASE_SETS } from '../constants/phrases';

interface ProgressReportProps {
  studentId: string;
}

// The 6 key metrics we track
interface ProgressMetrics {
  currentSet: number;
  setMastery: number;
  focusArea: string;
  needsWork: string[];
  recentAccuracy: number;
  attemptsToday: number;
}

export const ProgressReport = ({ studentId }: ProgressReportProps) => {
  const progress = getStudentProgress(studentId);
  const currentSetData = PHRASE_SETS[progress.currentSet];

  // Calculate all key metrics in one pass
  const getProgressMetrics = (): ProgressMetrics => {
    const currentPhrases = currentSetData.phrases;
    const today = new Date().toDateString();
    
    let masteredCount = 0;
    let totalAccuracy = 0;
    let attemptCount = 0;
    const strugglingPhrases: string[] = [];

    currentPhrases.forEach(phrase => {
      const record = progress.completedPhrases[phrase.id];
      if (!record) {
        strugglingPhrases.push(phrase.text);
        return;
      }

      if (record.mastered) masteredCount++;
      if (new Date(record.timestamp).toDateString() === today) attemptCount++;
      
      totalAccuracy += record.lastAccuracy;
      
      if (record.lastAccuracy < 70 || !record.mastered) {
        strugglingPhrases.push(phrase.text);
      }
    });

    return {
      currentSet: progress.currentSet + 1,
      setMastery: Math.round((masteredCount / currentPhrases.length) * 100),
      focusArea: currentSetData.focus,
      needsWork: strugglingPhrases.slice(0, 3), // Top 3 to focus on
      recentAccuracy: currentPhrases.length > 0 
        ? Math.round(totalAccuracy / currentPhrases.length) 
        : 0,
      attemptsToday: attemptCount
    };
  };

  const metrics = getProgressMetrics();

  return (
    <div className="progress-report">
      <h2>Progress Summary: {studentId}</h2>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Current Set</h3>
          <p>Set {metrics.currentSet}</p>
        </div>
        
        <div className="metric-card">
          <h3>Set Mastery</h3>
          <p>{metrics.setMastery}%</p>
        </div>
        
        <div className="metric-card">
          <h3>Focus Area</h3>
          <p>{metrics.focusArea}</p>
        </div>
        
        <div className="metric-card">
          <h3>Recent Accuracy</h3>
          <p>{metrics.recentAccuracy}%</p>
        </div>
        
        <div className="metric-card">
          <h3>Today's Attempts</h3>
          <p>{metrics.attemptsToday}</p>
        </div>
      </div>

      <div className="focus-area">
        <h3>Priority Practice</h3>
        <ul>
          {metrics.needsWork.map((phrase, i) => (
            <li key={i}>{phrase}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};