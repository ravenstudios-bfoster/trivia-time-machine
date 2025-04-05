import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import QuestionCard from "@/components/ui/QuestionCard";
import { LiveScore } from "@/components/ui/ScoreDisplay";
import TimeCircuit from "@/components/ui/TimeCircuit";
import { useGame } from "@/context/GameContext";
import { processAnswer } from "@/lib/gameLogic";
import { Question } from "@/types";
import { getQuestions } from "@/lib/firebase";

const Game = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { currentSession, currentQuestion, questions } = state;

  const [timeRemaining, setTimeRemaining] = useState(currentQuestion?.timeLimit || 30);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        // Only load questions if we don't have them yet
        if (questions.length === 0 && currentSession?.currentLevel) {
          setIsLoading(true);
          const loadedQuestions = await getQuestions(currentSession.currentLevel);
          dispatch({ type: "SET_QUESTIONS", payload: loadedQuestions });
        }
      } catch (error) {
        console.error("Failed to load questions:", error);
        navigate("/levels");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [dispatch, questions.length, navigate, currentSession?.currentLevel]);

  useEffect(() => {
    // Redirect if no current session or question
    if (!currentSession || !currentQuestion) {
      navigate("/levels");
      return;
    }

    // Reset time remaining when question changes
    setTimeRemaining(currentQuestion.timeLimit);
  }, [currentSession, currentQuestion, navigate]);

  // Get current level questions
  const currentLevelQuestions = questions.filter((q) => q.level === currentSession?.currentLevel) || [];

  // Get question number in current level
  const questionNumber = currentLevelQuestions.findIndex((q) => q.id === currentQuestion?.id) + 1;

  const handleSubmitAnswer = (selectedOptionId?: string, writtenAnswer?: string, timeLeft: number = 0, usedHint: boolean = false) => {
    if (!currentQuestion || !currentSession) return;

    // Process the answer
    const answer = processAnswer(currentQuestion, selectedOptionId, writtenAnswer, timeLeft, usedHint);

    // Submit the answer to the game context
    dispatch({
      type: "SUBMIT_ANSWER",
      payload: {
        questionId: currentQuestion.id,
        pointsEarned: answer.pointsEarned,
      },
    });

    // Transition effect
    setIsTransitioning(true);
    setTimeout(() => {
      // Move to next question
      dispatch({ type: "NEXT_QUESTION" });
      setIsTransitioning(false);

      // If no more questions in current level
      if (questionNumber >= currentLevelQuestions.length) {
        // Check if this was the last level
        const currentLevelIndex = currentSession.selectedLevels.indexOf(currentSession.currentLevel);
        if (currentLevelIndex >= currentSession.selectedLevels.length - 1) {
          // Complete the session
          dispatch({ type: "COMPLETE_SESSION" });
          navigate("/results");
          return;
        }
      }
    }, 1000);
  };

  // Calculate current score
  const currentScore = currentSession?.answers.reduce((sum, answer) => sum + answer.pointsEarned, 0) || 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your temporal challenge...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentSession || !currentQuestion) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div>
                <h1 className="bttf-heading text-2xl mb-1">Level {currentSession.currentLevel}</h1>
                <p className="text-muted-foreground">
                  Question {questionNumber} of {currentLevelQuestions.length}
                </p>
              </div>

              <div className="flex items-center gap-3 mt-3 md:mt-0">
                <TimeCircuit
                  label="Current Date"
                  value={new Date()
                    .toLocaleDateString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                    })
                    .replace(/\//g, "-")}
                  color="blue"
                />
              </div>
            </div>

            <LiveScore score={currentScore} questionNumber={questionNumber} totalQuestions={currentLevelQuestions.length} timeRemaining={timeRemaining} className="mb-6" />
          </div>

          <div className={`transition-all duration-500 ${isTransitioning ? "opacity-0 translate-x-10" : "opacity-100 translate-x-0"}`}>
            <QuestionCard question={currentQuestion} onSubmit={handleSubmitAnswer} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Game;
