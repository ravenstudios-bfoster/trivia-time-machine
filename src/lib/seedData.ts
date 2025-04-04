import { Timestamp } from "firebase/firestore";
import { Question, Game, AdminUser, UserRole, GameStatus, QuestionType, Level, Difficulty } from "@/types";

// Helper function to generate random IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Generate sample questions
export const generateQuestions = (count: number = 10): Omit<Question, "id" | "createdAt" | "updatedAt">[] => {
  const questions: Omit<Question, "id" | "createdAt" | "updatedAt">[] = [];
  const topics = ["History", "Science", "Pop Culture", "Sports", "Geography"];
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];
  const levels: Level[] = [1, 2, 3];
  const types: QuestionType[] = ["multiple-choice", "true-false", "write-in"];

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    const question: Omit<Question, "id" | "createdAt" | "updatedAt"> = {
      text: `Sample question ${i + 1} about ${topic}?`,
      type,
      level,
      difficulty,
      topic,
      pointValue: level * 100,
      timeLimit: 30,
      hintPenalty: 10,
      explanation: `This is the explanation for question ${i + 1}`,
    };

    if (type === "multiple-choice") {
      question.options = ["Option A", "Option B", "Option C", "Option D"];
      question.correctAnswer = Math.floor(Math.random() * 4);
    } else if (type === "true-false") {
      question.options = ["True", "False"];
      question.correctAnswer = Math.floor(Math.random() * 2);
    } else {
      question.correctAnswer = "Sample correct answer";
    }

    questions.push(question);
  }

  return questions;
};

// Generate sample games
export const generateGames = (count: number = 5): Omit<Game, "id" | "createdAt" | "participantCount">[] => {
  const games: Omit<Game, "id" | "createdAt" | "participantCount">[] = [];
  const statuses: GameStatus[] = ["scheduled", "active", "completed", "ended"];

  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const game: Omit<Game, "id" | "createdAt" | "participantCount"> = {
      title: `Sample Game ${i + 1}`,
      description: `This is a sample game description ${i + 1}`,
      adminId: "admin1",
      isPublic: Math.random() > 0.5,
      maxParticipants: Math.floor(Math.random() * 50) + 10,
      timeLimit: 30,
      allowedLevels: [1, 2, 3],
      enableHints: true,
      enableBonusQuestions: true,
      enablePostGameReview: true,
      status,
      currentQuestionIndex: 0,
      timeRemaining: 1800,
    };

    games.push(game);
  }

  return games;
};

// Generate sample admin users
export const generateAdminUsers = (count: number = 2): Omit<AdminUser, "id" | "createdAt">[] => {
  const users: Omit<AdminUser, "id" | "createdAt">[] = [
    {
      email: "admin@example.com",
      displayName: "Admin User",
      role: "admin" as UserRole,
      lastLogin: Timestamp.now(),
    },
    {
      email: "superadmin@example.com",
      displayName: "Super Admin",
      role: "super_admin" as UserRole,
      lastLogin: Timestamp.now(),
    },
  ];

  return users.slice(0, count);
};
