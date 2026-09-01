import { useQuizTimer, formatTime } from '../../hooks/useQuizTimer';

interface QuizTimerProps {
  durationSeconds: number;
  onTimeUp: () => void;
}

export function QuizTimer({ durationSeconds, onTimeUp }: QuizTimerProps) {
  const { timeRemaining, isWarning } = useQuizTimer(durationSeconds, onTimeUp);

  const isCritical = timeRemaining > 0 && timeRemaining <= 60;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold transition ${
        isCritical
          ? 'bg-red-100 text-red-700 animate-pulse'
          : isWarning
          ? 'bg-orange-100 text-orange-700'
          : 'bg-gray-100 text-gray-700'
      }`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{formatTime(timeRemaining)}</span>
      {isCritical && <span className="text-xs font-normal">- Time almost up!</span>}
      {isWarning && !isCritical && <span className="text-xs font-normal">- 5 min warning</span>}
    </div>
  );
}
