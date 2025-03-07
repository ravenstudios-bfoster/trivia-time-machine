
import { Question, Level, PlayerAnswer, QuestionType } from '@/types';

// Calculate points for a correct answer
export const calculatePoints = (
  question: Question,
  timeRemaining: number,
  usedHint: boolean
): number => {
  // Base points from question
  let points = question.pointValue;
  
  // Time bonus: up to 20% extra for finishing quickly
  const timeRatio = timeRemaining / question.timeLimit;
  const timeBonus = Math.floor(points * 0.2 * timeRatio);
  
  // Hint penalty
  const hintPenalty = usedHint ? question.hintPenalty : 0;
  
  return Math.max(0, points + timeBonus - hintPenalty);
};

// Check if an answer is correct
export const checkAnswer = (
  question: Question,
  selectedOptionId?: string,
  writtenAnswer?: string
): boolean => {
  if (question.type === 'write-in' && writtenAnswer && question.correctAnswer) {
    // For write-in, do a case-insensitive comparison
    return writtenAnswer.trim().toLowerCase() === question.correctAnswer.toLowerCase();
  } else if (question.type === 'multiple-choice' && selectedOptionId && question.options) {
    // For multiple-choice, find the selected option and check if it's correct
    const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
    return selectedOption?.isCorrect || false;
  } else if (question.type === 'true-false' && selectedOptionId && question.options) {
    // For true-false, similar to multiple-choice
    const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
    return selectedOption?.isCorrect || false;
  }
  
  return false;
};

// Process answer submission
export const processAnswer = (
  question: Question,
  selectedOptionId?: string,
  writtenAnswer?: string,
  timeRemaining: number = 0,
  usedHint: boolean = false
): PlayerAnswer => {
  const isCorrect = checkAnswer(question, selectedOptionId, writtenAnswer);
  
  // Only award points if the answer is correct
  const pointsEarned = isCorrect ? calculatePoints(question, timeRemaining, usedHint) : 0;
  
  return {
    questionId: question.id,
    selectedOptionId,
    writtenAnswer,
    usedHint,
    timeRemaining,
    isCorrect,
    pointsEarned
  };
};

// Format time as MM:SS
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Timer countdown function
export const createTimer = (
  duration: number,
  onTick: (timeRemaining: number) => void,
  onComplete: () => void
) => {
  let timeRemaining = duration;
  let intervalId: number | null = null;
  
  const start = () => {
    if (intervalId !== null) return;
    
    intervalId = window.setInterval(() => {
      timeRemaining -= 1;
      onTick(timeRemaining);
      
      if (timeRemaining <= 0) {
        stop();
        onComplete();
      }
    }, 1000);
  };
  
  const stop = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
  
  const reset = () => {
    stop();
    timeRemaining = duration;
    onTick(timeRemaining);
  };
  
  return { start, stop, reset };
};

// Get player level description
export const getLevelDescription = (level: Level): string => {
  switch (level) {
    case 1:
      return "Casual Viewer - Seen the movie a couple of times";
    case 2:
      return "Official Fan - Can quote dialog, knows special features";
    case 3:
      return "THE BIGGEST FAN - Hardcore, knows behind-the-scenes content, everything";
    default:
      return "";
  }
};

// Calculate total score from a list of answers
export const calculateTotalScore = (answers: PlayerAnswer[]): number => {
  return answers.reduce((total, answer) => total + answer.pointsEarned, 0);
};

// Calculate success rate from a list of answers
export const calculateSuccessRate = (answers: PlayerAnswer[]): number => {
  if (answers.length === 0) return 0;
  
  const correctAnswers = answers.filter(answer => answer.isCorrect).length;
  return Math.round((correctAnswers / answers.length) * 100);
};
