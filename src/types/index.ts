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
  id: string;
  startTime: Date;
  endTime?: Date;
  score: number;
  selectedLevels: Level[];
  answers: Array<{
    questionId: string;
    pointsEarned: number;
  }>;
  completedAt?: Date;
};

export interface Player {
  id: string;
  name: string;
  email?: string;
  sessions: GameSession[];
  highestLevelAchieved: Level;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

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

export type GameStatus = "draft" | "scheduled" | "active" | "completed" | "ended" | "cancelled";

export interface Game {
  id: string;
  title: string;
  description: string;
  maxParticipants: number;
  isPublic: boolean;
  status: "active" | "completed" | "cancelled";
  timeLimit: number;
  enableHints: boolean;
  enableBonusQuestions: boolean;
  enablePostGameReview: boolean;
  allowedLevels: string[];
  currentQuestionIndex: number;
  adminId: string;
  participants: Participant[];
  participantCount: number;
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
  totalAnswers: number;
  correctAnswers: number;
  completionRate: number;
  averageScore: number;
  questionStats: {
    questionId: string;
    totalAttempts: number;
    correctAttempts: number;
    correctRate: number;
  }[];
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

export interface AccessCode {
  id: string;
  code: string;
  isUsed: boolean;
  usedAt?: Timestamp;
  usedBy?: string;
}

export interface Costume {
  id: string;
  characterName: string;
  photoUrl: string;
  submittedBy: string;
  submitterName: string;
  categories: string[];
  createdAt: Date;
  votes: {
    [key: string]: number;
  };
}

export interface Vote {
  id: string;
  userId: string;
  costumeId: string;
  category: string;
  timestamp: Date;
}

export interface CostumeSubmission {
  photoUrl: string;
  characterName: string;
  submittedBy: string;
}

// Prop & Memorabilia Type
export interface Prop {
  id: string; // Use the unique ID entered by the admin (e.g., "flux-capacitor")
  title: string;
  imageUrl: string; // URL to the image (either provided URL or from Storage upload)
  videoUrl?: string; // Optional URL for a video (e.g., YouTube embed)
  description: string;
  movie: string;
  backstory: string;
  funFact?: string;
  year: number;
  externalLink?: string; // Optional URL to an external resource
  sortOrder: number; // Used to control display order of props
  // Add timestamps if needed later
  // createdAt?: Timestamp;
  // updatedAt?: Timestamp;
}

export interface CostumeCategory {
  id: string;
  tag: string;
  name: string;
  description: string;
  createdAt: Date;
}

export interface VotingWindow {
  // New format with full date-time
  startDateTime?: Timestamp;
  endDateTime?: Timestamp;
  // Old format with separate date and time
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  // Common fields
  message: string;
  updatedAt?: Timestamp;
}
