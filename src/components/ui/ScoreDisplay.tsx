
import { formatTime } from "@/lib/gameLogic";
import { Card } from "@/components/ui/card";

interface ScoreDisplayProps {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeBonus?: number;
  className?: string;
}

const ScoreDisplay = ({
  score,
  correctAnswers,
  totalQuestions,
  timeBonus = 0,
  className = ""
}: ScoreDisplayProps) => {
  const successRate = totalQuestions > 0 
    ? Math.round((correctAnswers / totalQuestions) * 100) 
    : 0;
  
  return (
    <Card className={`flux-container ${className}`}>
      <h3 className="text-xl font-['Orbitron'] text-center mb-4 text-bttf-blue">Score Summary</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-muted pb-2">
          <span className="font-medium">Total Score:</span>
          <span className="text-xl font-bold text-bttf-yellow">{score} pts</span>
        </div>
        
        <div className="flex justify-between items-center border-b border-muted pb-2">
          <span className="font-medium">Correct Answers:</span>
          <span className="font-bold">
            {correctAnswers} / {totalQuestions} ({successRate}%)
          </span>
        </div>
        
        {timeBonus > 0 && (
          <div className="flex justify-between items-center border-b border-muted pb-2">
            <span className="font-medium">Time Bonus:</span>
            <span className="font-bold text-green-400">+{timeBonus} pts</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export interface LiveScoreProps {
  score: number;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  className?: string;
}

export const LiveScore = ({
  score,
  questionNumber,
  totalQuestions,
  timeRemaining,
  className = ""
}: LiveScoreProps) => {
  return (
    <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="time-circuit-display blue-circuit">
          <span>Q {questionNumber}/{totalQuestions}</span>
        </div>
        
        <div className="time-circuit-display yellow-circuit">
          <span>{score} PTS</span>
        </div>
      </div>
      
      <div className="time-circuit-display red-circuit">
        <span>{formatTime(timeRemaining)}</span>
      </div>
    </div>
  );
};

export default ScoreDisplay;
