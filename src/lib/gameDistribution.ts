import { Game, Level, Participant, GameStatus, GameAnalytics } from "@/types";
import { createGame, getGameById, getGames } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";

interface GameDistributionOptions {
  selectedLevels: Level[];
  playerName: string;
  playerId: string;
  preferredGameSize?: number;
  avoidRecentGames?: boolean;
}

interface GameScore {
  game: Game;
  score: number;
}

/**
 * Calculates a score for a game based on various factors
 * Higher score means better match for the player
 */
const calculateGameScore = (game: Game, options: GameDistributionOptions): number => {
  let score = 0;

  // Check if game's allowed levels match selected levels
  if (game.allowedLevels?.every((level) => options.selectedLevels.includes(Number(level) as Level))) {
    score += 50;
  }

  // Check participant ratio
  const currentParticipants = game.participantCount || 0;
  const maxParticipants = game.maxParticipants || 20;
  const participantRatio = currentParticipants / maxParticipants;

  // Prefer games that are neither empty nor full
  if (participantRatio > 0.2 && participantRatio < 0.8) {
    score += 30;
  }

  // Check game status
  if (game.status === "active") {
    score += 20;
  }

  // Check if player is already in the game
  if (game.participants?.some((p) => p.id === options.playerId)) {
    score -= 100; // Strongly avoid games where player is already participating
  }

  return score;
};

/**
 * Finds the best game for a player based on their preferences and game state
 */
const findBestGame = async (options: GameDistributionOptions): Promise<Game | null> => {
  try {
    const activeGames = await getGames({ status: "active" });

    // Filter games that match the selected levels
    const eligibleGames = activeGames.filter((game) => game.allowedLevels?.some((level) => options.selectedLevels.includes(Number(level) as Level)));

    if (eligibleGames.length === 0) {
      return null;
    }

    // Calculate scores for each game
    const scoredGames: GameScore[] = eligibleGames.map((game) => ({
      game,
      score: calculateGameScore(game, options),
    }));

    // Sort by score and return the best game
    scoredGames.sort((a, b) => b.score - a.score);
    return scoredGames[0].score > 0 ? scoredGames[0].game : null;
  } catch (error) {
    console.error("Error finding best game:", error);
    return null;
  }
};

/**
 * Creates a balanced game if no suitable existing game is found
 */
const createBalancedGame = async (options: GameDistributionOptions): Promise<Game> => {
  const newGame: Omit<Game, "id" | "createdAt" | "participantCount"> = {
    title: `Back to the Future Trivia - ${new Date().toLocaleDateString()}`,
    description: "A balanced game for all time travelers",
    maxParticipants: options.preferredGameSize || 20,
    isPublic: true,
    status: "active",
    timeLimit: 30,
    enableHints: true,
    enableBonusQuestions: true,
    enablePostGameReview: true,
    allowedLevels: options.selectedLevels.map((level) => level.toString()),
    currentQuestionIndex: 0,
    adminId: options.playerId,
    participants: [],
    updatedAt: Timestamp.now(),
  };

  const gameId = await createGame(newGame);
  const game = await getGameById(gameId);

  if (!game) {
    throw new Error("Failed to create new game");
  }

  return game;
};

/**
 * Main function to get or create a game for a player
 */
export const getOrCreateGame = async (options: GameDistributionOptions): Promise<Game> => {
  // Try to find an existing game first
  const existingGame = await findBestGame(options);

  if (existingGame) {
    return existingGame;
  }

  // If no suitable game found, create a new one
  return createBalancedGame(options);
};
