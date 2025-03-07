
export type QuestionType = 'multiple-choice' | 'true-false' | 'write-in';

export type Level = 1 | 2 | 3;

export type AnswerOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  text: string;
  type: QuestionType;
  level: Level;
  pointValue: number;
  timeLimit: number; // in seconds
  options?: AnswerOption[];
  correctAnswer?: string; // For write-in questions
  imageUrl?: string;
  videoUrl?: string;
  hint?: string;
  hintPenalty: number;
  explanation?: string;
};

export type PlayerAnswer = {
  questionId: string;
  selectedOptionId?: string;
  writtenAnswer?: string;
  usedHint: boolean;
  timeRemaining: number;
  isCorrect: boolean;
  pointsEarned: number;
};

export type GameSession = {
  playerId: string;
  playerName: string;
  startTime: Date;
  endTime?: Date;
  selectedLevels: Level[];
  currentLevel?: Level;
  currentQuestionIndex: number;
  answers: PlayerAnswer[];
  totalScore: number;
  isCompleted: boolean;
};

export type Player = {
  id: string;
  name: string;
  email?: string;
  profileImageUrl?: string;
  sessions: GameSession[];
  highScore?: number;
};

export type GameState = {
  player: Player | null;
  currentSession: GameSession | null;
  questions: Question[];
  currentQuestion: Question | null;
  isLoading: boolean;
  error: string | null;
};

export type GameAction = 
  | { type: 'SET_PLAYER'; payload: Player }
  | { type: 'START_SESSION'; payload: { playerName: string; selectedLevels: Level[] } }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'SET_CURRENT_QUESTION'; payload: Question }
  | { type: 'NEXT_QUESTION' }
  | { type: 'SUBMIT_ANSWER'; payload: PlayerAnswer }
  | { type: 'USE_HINT' }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };
