
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, GameAction, Level, Question, PlayerAnswer, Player } from '@/types';
import { sampleQuestions } from '@/lib/questions';

const initialState: GameState = {
  player: null,
  currentSession: null,
  questions: [],
  currentQuestion: null,
  isLoading: false,
  error: null
};

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}>({
  state: initialState,
  dispatch: () => null
});

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PLAYER':
      return {
        ...state,
        player: action.payload
      };
    
    case 'START_SESSION': {
      const { playerName, selectedLevels } = action.payload;
      const playerId = state.player?.id || `player_${Date.now()}`;
      
      // Filter questions for selected levels
      const levelQuestions = state.questions.filter(q => 
        selectedLevels.includes(q.level as Level)
      );
      
      // Create a new session
      const newSession = {
        playerId,
        playerName,
        startTime: new Date(),
        selectedLevels,
        currentLevel: selectedLevels[0],
        currentQuestionIndex: 0,
        answers: [],
        totalScore: 0,
        isCompleted: false
      };
      
      // Get first question
      const firstQuestion = levelQuestions.find(q => q.level === selectedLevels[0]) || null;
      
      return {
        ...state,
        player: state.player || { 
          id: playerId, 
          name: playerName, 
          sessions: []
        },
        currentSession: newSession,
        currentQuestion: firstQuestion
      };
    }
    
    case 'SET_QUESTIONS':
      return {
        ...state,
        questions: action.payload
      };
    
    case 'SET_CURRENT_QUESTION':
      return {
        ...state,
        currentQuestion: action.payload
      };
    
    case 'NEXT_QUESTION': {
      if (!state.currentSession || !state.currentQuestion) {
        return state;
      }
      
      const { currentLevel, currentQuestionIndex, selectedLevels } = state.currentSession;
      
      // Get questions for current level
      const levelQuestions = state.questions.filter(q => q.level === currentLevel);
      
      // Check if there are more questions in current level
      if (currentQuestionIndex < levelQuestions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        const nextQuestion = levelQuestions[nextIndex];
        
        return {
          ...state,
          currentQuestion: nextQuestion,
          currentSession: {
            ...state.currentSession,
            currentQuestionIndex: nextIndex
          }
        };
      } 
      // Move to next selected level if available
      else {
        const currentLevelIndex = selectedLevels.indexOf(currentLevel as Level);
        
        // Check if there's another level to move to
        if (currentLevelIndex < selectedLevels.length - 1) {
          const nextLevel = selectedLevels[currentLevelIndex + 1];
          const nextLevelQuestions = state.questions.filter(q => q.level === nextLevel);
          
          if (nextLevelQuestions.length > 0) {
            return {
              ...state,
              currentQuestion: nextLevelQuestions[0],
              currentSession: {
                ...state.currentSession,
                currentLevel: nextLevel,
                currentQuestionIndex: 0
              }
            };
          }
        }
        
        // If no more questions/levels, complete the session
        return {
          ...state,
          currentQuestion: null,
          currentSession: {
            ...state.currentSession,
            isCompleted: true,
            endTime: new Date()
          }
        };
      }
    }
    
    case 'SUBMIT_ANSWER': {
      if (!state.currentSession) {
        return state;
      }
      
      const newAnswer = action.payload;
      const updatedAnswers = [...state.currentSession.answers, newAnswer];
      const newTotalScore = updatedAnswers.reduce((sum, answer) => sum + answer.pointsEarned, 0);
      
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          answers: updatedAnswers,
          totalScore: newTotalScore
        }
      };
    }
    
    case 'USE_HINT': {
      // This would be handled in the Game component
      return state;
    }
    
    case 'COMPLETE_SESSION': {
      if (!state.currentSession || !state.player) {
        return state;
      }
      
      const completedSession = {
        ...state.currentSession,
        isCompleted: true,
        endTime: new Date()
      };
      
      // Update player with new session
      const updatedSessions = [...state.player.sessions, completedSession];
      const highScore = Math.max(
        state.player.highScore || 0,
        completedSession.totalScore
      );
      
      const updatedPlayer = {
        ...state.player,
        sessions: updatedSessions,
        highScore
      };
      
      return {
        ...state,
        player: updatedPlayer,
        currentSession: completedSession
      };
    }
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    
    default:
      return state;
  }
}

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, {
    ...initialState,
    questions: sampleQuestions, // Load sample questions initially
  });
  
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
