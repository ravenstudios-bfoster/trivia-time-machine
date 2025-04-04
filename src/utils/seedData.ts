import { createGame, createQuestion, addQuestionsToGame } from "@/lib/firebase";
import { Game, Question, Level, QuestionType, Difficulty } from "@/types";

// Sample questions for seeding
const sampleQuestions: Omit<Question, "id" | "createdAt" | "updatedAt" | "createdBy">[] = [
  {
    text: "What year does Marty McFly travel to in the first Back to the Future film?",
    type: "multiple-choice",
    level: 1,
    difficulty: "easy",
    topic: "Back to the Future",
    pointValue: 10,
    timeLimit: 30,
    options: ["1945", "1955", "1965", "1975"],
    correctAnswer: 1, // 1955
    hintPenalty: 2,
    hint: "It's the year Doc Brown invented the flux capacitor.",
  },
  {
    text: "What is the name of Doc Brown's dog in 1985?",
    type: "multiple-choice",
    level: 1,
    difficulty: "easy",
    topic: "Back to the Future",
    pointValue: 10,
    timeLimit: 30,
    options: ["Einstein", "Newton", "Copernicus", "Galileo"],
    correctAnswer: 0, // Einstein
    hintPenalty: 2,
    hint: "Named after a famous physicist.",
  },
  {
    text: "The DeLorean needs to reach 88 mph to travel through time.",
    type: "true-false",
    level: 1,
    difficulty: "easy",
    topic: "Back to the Future",
    pointValue: 5,
    timeLimit: 20,
    options: ["True", "False"],
    correctAnswer: 0, // True
    hintPenalty: 1,
    hint: "It's a specific speed mentioned multiple times.",
  },
  {
    text: "What does the 'flux capacitor' run on in the first film?",
    type: "multiple-choice",
    level: 2,
    difficulty: "medium",
    topic: "Back to the Future",
    pointValue: 15,
    timeLimit: 30,
    options: ["Gasoline", "Uranium", "Plutonium", "Lithium"],
    correctAnswer: 2, // Plutonium
    hintPenalty: 3,
    hint: "It's a radioactive element Doc Brown got from Libyan terrorists.",
  },
  {
    text: "What is the name of the mall where Marty meets Doc Brown for the time travel experiment?",
    type: "write-in",
    level: 2,
    difficulty: "medium",
    topic: "Back to the Future",
    pointValue: 20,
    timeLimit: 40,
    correctAnswer: "Twin Pines Mall",
    hintPenalty: 5,
    hint: "It has a name related to trees.",
  },
  {
    text: "In Back to the Future Part II, what year does Doc take Marty and Jennifer to visit?",
    type: "multiple-choice",
    level: 2,
    difficulty: "medium",
    topic: "Back to the Future II",
    pointValue: 15,
    timeLimit: 30,
    options: ["2000", "2005", "2015", "2025"],
    correctAnswer: 2, // 2015
    hintPenalty: 3,
    hint: "It's exactly 30 years after 1985.",
  },
  {
    text: "What is the name of Biff's grandson in Back to the Future Part II?",
    type: "multiple-choice",
    level: 3,
    difficulty: "hard",
    topic: "Back to the Future II",
    pointValue: 25,
    timeLimit: 40,
    options: ["Cliff", "Griff", "Riff", "Biff Jr."],
    correctAnswer: 1, // Griff
    hintPenalty: 5,
    hint: "His name rhymes with Biff.",
  },
  {
    text: "In Back to the Future Part III, what year does Doc Brown get trapped in?",
    type: "multiple-choice",
    level: 2,
    difficulty: "medium",
    topic: "Back to the Future III",
    pointValue: 15,
    timeLimit: 30,
    options: ["1855", "1865", "1875", "1885"],
    correctAnswer: 3, // 1885
    hintPenalty: 3,
    hint: "It's the Old West era.",
  },
  {
    text: "What is the name of Doc Brown's love interest in Back to the Future Part III?",
    type: "write-in",
    level: 3,
    difficulty: "hard",
    topic: "Back to the Future III",
    pointValue: 25,
    timeLimit: 40,
    correctAnswer: "Clara Clayton",
    hintPenalty: 5,
    hint: "She's a schoolteacher who was supposed to die in a ravine.",
  },
  {
    text: "What is the top speed of the DeLorean according to the speedometer shown in the films?",
    type: "multiple-choice",
    level: 3,
    difficulty: "hard",
    topic: "Back to the Future",
    pointValue: 25,
    timeLimit: 30,
    options: ["85 mph", "95 mph", "125 mph", "155 mph"],
    correctAnswer: 2, // 125 mph
    hintPenalty: 5,
    hint: "It's higher than the speed needed for time travel.",
  },
];

// Sample games for seeding
const sampleGames: Omit<Game, "id" | "createdAt" | "participantCount">[] = [
  {
    title: "Back to the Future Trivia: Beginner",
    description: "Test your knowledge of the Back to the Future trilogy with these beginner-level questions!",
    adminId: "admin123", // Replace with actual admin ID
    isPublic: true,
    maxParticipants: 20,
    timeLimit: 30,
    allowedLevels: [1],
    enableHints: true,
    enableBonusQuestions: false,
    enablePostGameReview: true,
    status: "scheduled",
    currentQuestionIndex: 0,
    timeRemaining: 30,
    questionIds: [],
  },
  {
    title: "Back to the Future Trivia: Intermediate",
    description: "A more challenging set of questions for fans who know the trilogy well!",
    adminId: "admin123", // Replace with actual admin ID
    isPublic: true,
    maxParticipants: 15,
    timeLimit: 40,
    allowedLevels: [1, 2],
    enableHints: true,
    enableBonusQuestions: true,
    enablePostGameReview: true,
    status: "scheduled",
    currentQuestionIndex: 0,
    timeRemaining: 40,
    questionIds: [],
  },
  {
    title: "Back to the Future Trivia: Expert",
    description: "Only for the biggest fans! These questions will challenge even the most dedicated Back to the Future enthusiasts!",
    adminId: "admin123", // Replace with actual admin ID
    isPublic: false,
    maxParticipants: 10,
    timeLimit: 45,
    allowedLevels: [1, 2, 3],
    enableHints: false,
    enableBonusQuestions: true,
    enablePostGameReview: true,
    status: "scheduled",
    currentQuestionIndex: 0,
    timeRemaining: 45,
    questionIds: [],
  },
];

/**
 * Seeds the database with sample questions
 * @returns Array of created question IDs
 */
export const seedQuestions = async (): Promise<string[]> => {
  try {
    const questionIds: string[] = [];

    for (const question of sampleQuestions) {
      const questionId = await createQuestion(question);
      questionIds.push(questionId);
      console.log(`Created question: ${questionId}`);
    }

    return questionIds;
  } catch (error) {
    console.error("Error seeding questions:", error);
    throw error;
  }
};

/**
 * Seeds the database with sample games
 * @param questionIds Optional array of question IDs to add to the games
 * @returns Array of created game IDs
 */
export const seedGames = async (questionIds?: string[]): Promise<string[]> => {
  try {
    const gameIds: string[] = [];

    for (const game of sampleGames) {
      const gameId = await createGame(game);
      gameIds.push(gameId);
      console.log(`Created game: ${gameId}`);

      // Add questions to the game if provided
      if (questionIds && questionIds.length > 0) {
        // Filter questions by level based on game's allowedLevels
        const filteredQuestionIds = await filterQuestionsByLevel(questionIds, game.allowedLevels);
        if (filteredQuestionIds.length > 0) {
          await addQuestionsToGame(gameId, filteredQuestionIds);
          console.log(`Added ${filteredQuestionIds.length} questions to game: ${gameId}`);
        }
      }
    }

    return gameIds;
  } catch (error) {
    console.error("Error seeding games:", error);
    throw error;
  }
};

/**
 * Seeds both questions and games
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    console.log("Starting database seeding...");

    // First seed questions
    const questionIds = await seedQuestions();
    console.log(`Created ${questionIds.length} questions`);

    // Then seed games with the created questions
    const gameIds = await seedGames(questionIds);
    console.log(`Created ${gameIds.length} games`);

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

/**
 * Helper function to filter questions by level
 */
const filterQuestionsByLevel = async (questionIds: string[], allowedLevels: Level[]): Promise<string[]> => {
  // In a real implementation, you would fetch the questions and filter them
  // For simplicity, we'll just distribute the questions based on their index

  return questionIds.filter((_, index) => {
    const level = ((index % 3) + 1) as Level; // Distribute as level 1, 2, 3
    return allowedLevels.includes(level);
  });
};
