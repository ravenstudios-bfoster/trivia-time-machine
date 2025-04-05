import React, { createContext, useContext, useReducer, ReactNode, useEffect } from "react";
import { Player, Level, GameSession, Question } from "@/types";

interface GameState {
  player: Player | null;
  questions: Question[];
  currentQuestion: Question | null;
  currentSession: {
    gameId: string;
    selectedLevels: Level[];
    currentLevel: Level;
    currentQuestionIndex: number;
    score: number;
    isCompleted?: boolean;
    answers: Array<{
      questionId: string;
      pointsEarned: number;
    }>;
  } | null;
}

type GameAction =
  | { type: "SET_PLAYER"; payload: Player }
  | { type: "SET_QUESTIONS"; payload: Question[] }
  | { type: "START_SESSION"; payload: { selectedLevels: Level[]; gameId: string } }
  | { type: "CLEAR_SESSION" }
  | { type: "UPDATE_SCORE"; payload: number }
  | { type: "NEXT_QUESTION" }
  | { type: "SUBMIT_ANSWER"; payload: { questionId: string; pointsEarned: number } }
  | { type: "COMPLETE_SESSION" }
  | { type: "LOGOUT" };

const initialState: GameState = {
  player: null,
  questions: [],
  currentQuestion: null,
  currentSession: null,
};

// Load state from localStorage
const loadState = (): GameState => {
  try {
    const serializedState = localStorage.getItem("gameState");
    if (serializedState === null) {
      return initialState;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Error loading state from localStorage:", err);
    return initialState;
  }
};

// Save state to localStorage
const saveState = (state: GameState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("gameState", serializedState);
  } catch (err) {
    console.error("Error saving state to localStorage:", err);
  }
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  let firstLevel: Level;
  let firstQuestion: Question | null;
  let nextIndex: number;
  let currentLevelQuestions: Question[];
  let nextQuestion: Question | null;
  let currentLevelIndex: number;
  let nextLevel: Level;
  let nextLevelFirstQuestion: Question | null;

  let newState: GameState;

  switch (action.type) {
    case "SET_PLAYER":
      newState = {
        ...state,
        player: action.payload,
      };
      break;

    case "SET_QUESTIONS":
      newState = {
        ...state,
        questions: action.payload,
        currentQuestion: state.currentSession ? action.payload[state.currentSession.currentQuestionIndex] : null,
      };
      break;

    case "START_SESSION":
      if (!state.player) return state;
      firstLevel = action.payload.selectedLevels[0];
      firstQuestion = state.questions.find((q) => q.level === firstLevel) || null;

      newState = {
        ...state,
        currentSession: {
          gameId: action.payload.gameId,
          selectedLevels: action.payload.selectedLevels,
          currentLevel: firstLevel,
          currentQuestionIndex: 0,
          score: 0,
          answers: [],
        },
        currentQuestion: firstQuestion,
      };
      break;

    case "CLEAR_SESSION":
      newState = {
        ...state,
        currentSession: null,
        currentQuestion: null,
      };
      break;

    case "UPDATE_SCORE":
      if (!state.currentSession) return state;
      newState = {
        ...state,
        currentSession: {
          ...state.currentSession,
          score: state.currentSession.score + action.payload,
        },
      };
      break;

    case "NEXT_QUESTION":
      if (!state.currentSession || !state.questions.length) return state;

      // Get questions for current level
      currentLevelQuestions = state.questions.filter((q) => q.level === state.currentSession!.currentLevel);

      // Check if we've completed all questions for current level
      nextIndex = state.currentSession.currentQuestionIndex + 1;
      if (nextIndex >= currentLevelQuestions.length) {
        // Move to next level
        currentLevelIndex = state.currentSession.selectedLevels.indexOf(state.currentSession.currentLevel);
        if (currentLevelIndex < state.currentSession.selectedLevels.length - 1) {
          nextLevel = state.currentSession.selectedLevels[currentLevelIndex + 1];
          nextLevelFirstQuestion = state.questions.find((q) => q.level === nextLevel) || null;

          newState = {
            ...state,
            currentSession: {
              ...state.currentSession,
              currentLevel: nextLevel,
              currentQuestionIndex: 0,
            },
            currentQuestion: nextLevelFirstQuestion,
          };
        } else {
          // All levels completed
          newState = {
            ...state,
            currentSession: {
              ...state.currentSession,
              currentQuestionIndex: nextIndex,
            },
            currentQuestion: null,
          };
        }
      } else {
        // Move to next question in current level
        nextQuestion = currentLevelQuestions[nextIndex];
        newState = {
          ...state,
          currentSession: {
            ...state.currentSession,
            currentQuestionIndex: nextIndex,
          },
          currentQuestion: nextQuestion,
        };
      }
      break;

    case "SUBMIT_ANSWER":
      if (!state.currentSession) return state;
      newState = {
        ...state,
        currentSession: {
          ...state.currentSession,
          answers: [
            ...state.currentSession.answers,
            {
              questionId: action.payload.questionId,
              pointsEarned: action.payload.pointsEarned,
            },
          ],
        },
      };
      break;

    case "COMPLETE_SESSION":
      if (!state.currentSession) return state;
      newState = {
        ...state,
        currentSession: {
          ...state.currentSession,
          currentQuestionIndex: state.questions.length,
          isCompleted: true,
        },
        currentQuestion: null,
      };
      break;

    case "LOGOUT":
      newState = initialState;
      break;

    default:
      return state;
  }

  // Save state to localStorage after each action
  saveState(newState);
  return newState;
};

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(gameReducer, loadState());

  // Clear state from localStorage on window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (state.currentSession) {
        // Only clear if the session is completed
        if (state.currentSession.currentQuestionIndex >= state.questions.length) {
          localStorage.removeItem("gameState");
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state]);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
};

export const useGame = () => useContext(GameContext);
