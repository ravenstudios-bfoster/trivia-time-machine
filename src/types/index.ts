import { Timestamp } from "firebase/firestore";

export type QuestionType = "multiple-choice" | "true-false" | "write-in";

export type Level = 1 | 2 | 3;

export type Difficulty = "easy" | "medium" | "hard";

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
  difficulty: Difficulty;
  topic: string;
  pointValue: number;
  timeLimit: number; // in seconds
  options?: string[]; // For multiple-choice and true-false
  correctAnswer?: number | string; // Index for multiple-choice, string for write-in
  imageUrl?: string;
  videoUrl?: string;
  hint?: string;
  hintPenalty: number;
  explanation?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
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
  gameId?: string;
  status?: PlayerStatus;
  joinTime?: Timestamp;
  updatedAt?: Timestamp;
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
  | { type: "SET_PLAYER"; payload: Player }
  | { type: "START_SESSION"; payload: { playerName: string; selectedLevels: Level[] } }
  | { type: "SET_QUESTIONS"; payload: Question[] }
  | { type: "SET_CURRENT_QUESTION"; payload: Question }
  | { type: "NEXT_QUESTION" }
  | { type: "SUBMIT_ANSWER"; payload: PlayerAnswer }
  | { type: "USE_HINT" }
  | { type: "COMPLETE_SESSION" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

// Admin-specific types
export type PlayerStatus = "active" | "completed" | "kicked";

export type GameStatus = "draft" | "scheduled" | "active" | "completed" | "cancelled";

export interface Game {
  id: string;
  title: string;
  description?: string;
  maxPlayers: number;
  isPublic: boolean;
  status: GameStatus;
  scheduledStartTime: Timestamp | null;
  expirationTime: Timestamp | null;
  adminId: string;
  currentQuestionIndex: number;
  questionIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Game Question Junction
export type GameQuestion = {
  gameId: string;
  questionId: string;
  order: number;
};

// Participant Types
export type ParticipantStatus = "waiting" | "active" | "thinking" | "completed" | "kicked";

export type ParticipantAnswer = {
  questionId: string;
  questionIndex: number;
  selectedAnswer: number | string;
  isCorrect: boolean;
  pointsEarned: number;
  timeRemaining: number;
  usedHint: boolean;
};

export type Participant = {
  id: string;
  gameId: string;
  name: string;
  status: ParticipantStatus;
  score: number;
  correctAnswers: number;
  isOnline: boolean;

  // Timestamps
  joinedAt: Timestamp;
  lastActiveAt?: Timestamp;
  lastAnswerAt?: Timestamp;

  // Session data
  currentLevel?: Level;
  selectedLevels?: Level[];

  // Answers
  answers: ParticipantAnswer[];
};

// Admin User Types
export type UserRole = "admin" | "super_admin";

export type AdminUser = {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
  lastLogin?: Timestamp;
  createdAt: Timestamp;
};

// Game Analytics
export type QuestionStat = {
  questionId: string;
  correctRate: number; // percentage
  averageTime: number; // seconds
  hintUsageRate: number; // percentage
};

export type GameAnalytics = {
  gameId: string;
  totalParticipants: number;
  averageScore: number;
  completionRate: number; // percentage
  questionStats: QuestionStat[];
};

// Filter Types
export type QuestionFilter = {
  level?: Level;
  difficulty?: Difficulty;
  topic?: string;
  type?: QuestionType;
  hasMedia?: boolean;
  searchTerm?: string;
};

export type GameFilter = {
  status?: GameStatus;
  adminId?: string;
  searchTerm?: string;
  startDate?: Date;
  endDate?: Date;
  isPublic?: boolean;
};

export type ParticipantFilter = {
  status?: ParticipantStatus;
  searchTerm?: string;
  minScore?: number;
  maxScore?: number;
};
