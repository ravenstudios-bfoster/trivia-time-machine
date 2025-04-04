import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { Player, Level, GameSession } from "@/types";

interface GameState {
  player: Player | null;
  currentSession: {
    selectedLevels: Level[];
    currentQuestionIndex: number;
    score: number;
  } | null;
}

type GameAction =
  | { type: "SET_PLAYER"; payload: Player }
  | { type: "START_SESSION"; payload: { selectedLevels: Level[] } }
  | { type: "CLEAR_SESSION" }
  | { type: "UPDATE_SCORE"; payload: number }
  | { type: "NEXT_QUESTION" }
  | { type: "LOGOUT" };

const initialState: GameState = {
  player: null,
  currentSession: null,
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "SET_PLAYER":
      return {
        ...state,
        player: action.payload,
      };

    case "START_SESSION":
      if (!state.player) return state;
      return {
        ...state,
        currentSession: {
          selectedLevels: action.payload.selectedLevels,
          currentQuestionIndex: 0,
          score: 0,
        },
      };

    case "CLEAR_SESSION":
      return {
        ...state,
        currentSession: null,
      };

    case "UPDATE_SCORE":
      if (!state.currentSession) return state;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          score: state.currentSession.score + action.payload,
        },
      };

    case "NEXT_QUESTION":
      if (!state.currentSession) return state;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          currentQuestionIndex: state.currentSession.currentQuestionIndex + 1,
        },
      };

    case "LOGOUT":
      return initialState;

    default:
      return state;
  }
};

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
