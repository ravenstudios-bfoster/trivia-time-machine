import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/ui/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getGameById, getGameQuestions, joinGame, submitGameAnswer, hasUserPlayedGame } from "@/lib/firebase";
import { Game, Question } from "@/types";
import { useGame } from "@/context/GameContext";
import { toast } from "sonner";
import { Trophy, BrainCircuit, HelpCircle, Clock, ArrowRight } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Timestamp } from "firebase/firestore";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const GamePlay = () => {
  const { state, dispatch } = useGame();
  const { currentUser } = useAuth();
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<"loading" | "start" | "playing" | "ended">("loading");
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [finalTotalScore, setFinalTotalScore] = useState<number | null>(null);
  const [finalTotalTime, setFinalTotalTime] = useState<number | null>(null);

  useEffect(() => {
    console.log("GamePlay mounted, current state:", {
      state,
      currentUser,
      gameId,
    });
  }, [state, currentUser, gameId]);

  useEffect(() => {
    const loadGame = async () => {
      if (!gameId) {
        toast.error("No game selected");
        navigate("/");
        return;
      }

      try {
        const gameData = await getGameById(gameId);
        if (!gameData) {
          toast.error("Game not found");
          navigate("/");
          return;
        }

        setGame(gameData);
        const gameQuestions = await getGameQuestions(gameId);
        setQuestions(gameQuestions);
        setTimeLeft(gameData.timeLimit || 30);

        // Check if user has already played this game
        if (currentUser) {
          const played = await hasUserPlayedGame(gameId, currentUser.id);
          setHasPlayed(played);
          if (played) {
            toast.error("You have already played this game!");
          }
        }

        setGameState("start");
      } catch (error) {
        console.error("Error loading game:", error);
        toast.error("Failed to load game");
        navigate("/");
      }
    };

    loadGame();
  }, [gameId, navigate, currentUser]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAnswerSubmit(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, currentQuestionIndex]);

  const handleStartGame = async () => {
    console.log("Start Game button clicked");
    console.log("Current auth state:", { currentUser, gameId, game });

    if (!gameId) {
      console.log("No gameId found");
      return;
    }

    if (!currentUser) {
      console.log("No user found in AuthContext");
      toast.error("Please log in to play");
      return;
    }

    try {
      // Check if user has already played this game
      const hasPlayed = await hasUserPlayedGame(gameId, currentUser.id);
      if (hasPlayed) {
        toast.error("You have already played this game!");
        return;
      }

      console.log("Attempting to join game with user:", currentUser.id);
      await joinGame(gameId, currentUser.id);
      console.log("Successfully joined game");
      setGameState("playing");

      // Update the game context with the current player
      dispatch({
        type: "SET_PLAYER",
        payload: {
          id: currentUser.id,
          name: currentUser.displayName,
          email: currentUser.email,
          sessions: [],
          highestLevelAchieved: 1,
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        },
      });
    } catch (error) {
      console.error("Error joining game:", error);
      toast.error("Failed to join game");
    }
  };

  // Helper to update game-results in Firestore
  async function updateGameResult({
    gameId,
    participantId,
    displayName,
    questionId,
    answeredCorrectly,
    timeTaken,
    pointValue,
    level,
  }: {
    gameId: string;
    participantId: string;
    displayName: string;
    questionId: string;
    answeredCorrectly: boolean;
    timeTaken: number;
    pointValue: number;
    level: number;
  }) {
    type QuestionResult = {
      questionId: string;
      answeredCorrectly: boolean;
      timeTaken: number;
      score: number;
    };
    const resultRef = doc(db, "game-results", `${gameId}_${participantId}`);
    const resultSnap = await getDoc(resultRef);

    let questions: QuestionResult[] = [];
    let totalCorrect = 0;
    let totalScore = 0;
    let totalTime = 0;

    if (resultSnap.exists()) {
      const data = resultSnap.data();
      questions = (data.questions as QuestionResult[]) || [];
      // Remove any previous entry for this question
      questions = questions.filter((q) => q.questionId !== questionId);
      // Add the new/updated entry
      questions.push({
        questionId,
        answeredCorrectly,
        timeTaken,
        score: answeredCorrectly ? pointValue : 0,
      });
    } else {
      questions = [
        {
          questionId,
          answeredCorrectly,
          timeTaken,
          score: answeredCorrectly ? pointValue : 0,
        },
      ];
    }

    // Recalculate totals
    totalCorrect = questions.filter((q) => q.answeredCorrectly).length;
    totalScore = questions.reduce((sum, q) => sum + (q.score || 0), 0);
    totalTime = questions.reduce((sum, q) => sum + (q.timeTaken || 0), 0);

    // Write back to Firestore
    await setDoc(
      resultRef,
      {
        gameId,
        participantId,
        displayName,
        level,
        questions,
        totalCorrect,
        totalScore,
        totalTime,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  const handleAnswerSubmit = async (answer: string | null) => {
    if (!game || !questions[currentQuestionIndex] || !state.player) return;

    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswerIndex = answer ? parseInt(answer) : -1;

    console.log("Answer submission:", {
      selectedAnswer: answer,
      selectedIndex: selectedAnswerIndex,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect: selectedAnswerIndex === currentQuestion.correctAnswer,
    });

    const isCorrect = selectedAnswerIndex === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    // Submit answer to Firebase
    await submitGameAnswer(game.id, state.player.id, {
      questionId: questions[currentQuestionIndex].id,
      selectedAnswer: currentQuestion.options?.[selectedAnswerIndex] || "",
      isCorrect,
      timeRemaining: timeLeft,
    });

    // --- Update game-results in Firestore ---
    await updateGameResult({
      gameId: game.id,
      participantId: state.player.id,
      displayName: state.player.name || currentUser?.displayName || "Player",
      questionId: currentQuestion.id,
      answeredCorrectly: isCorrect,
      timeTaken: (game.timeLimit || 30) - timeLeft,
      pointValue: currentQuestion.pointValue,
      level: parseInt(game.allowedLevels[0]),
    });
    // ---------------------------------------

    // Move to next question or end game
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setTimeLeft(game.timeLimit || 30);
      setShowHint(false);
    } else {
      setGameState("ended");
    }
  };

  // Fetch totalScore and totalTime from game-results at game end
  useEffect(() => {
    const fetchGameResults = async () => {
      if (gameState === "ended" && game && currentUser) {
        const resultRef = doc(db, "game-results", `${game.id}_${currentUser.id}`);
        const resultSnap = await getDoc(resultRef);
        if (resultSnap.exists()) {
          const data = resultSnap.data();
          setFinalTotalScore(data.totalScore ?? null);
          setFinalTotalTime(data.totalTime ?? null);
        }
      }
    };
    fetchGameResults();
  }, [gameState, game, currentUser]);

  if (gameState === "loading") {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-[#FF3D00] border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!game) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600">Loading game...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (gameState === "start") {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-6">
          <Card className="p-6 space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold">{game.title}</h1>
              <div className="flex items-center justify-center gap-2">
                {game.allowedLevels.includes("3") ? <BrainCircuit className="w-6 h-6 text-purple-500" /> : <Trophy className="w-6 h-6 text-yellow-500" />}
                <span className="text-lg font-semibold">{game.allowedLevels.includes("3") ? "Bragging Rights" : "Prize Eligible"}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Game Rules</h2>
              <ul className="space-y-2 text-gray-600">
                <li>• You have {game.timeLimit || 30} seconds to answer each question</li>
                {game.enableHints && <li>• Hints are available for each question</li>}
                <li>• Your score will be tracked for the leaderboard</li>
                {!game.allowedLevels.includes("3") && <li>• This game is eligible for prizes!</li>}
              </ul>
            </div>

            {hasPlayed ? (
              <div className="text-center text-red-500 font-semibold">You have already played this game!</div>
            ) : (
              <Button onClick={handleStartGame} className="w-full bg-gradient-to-r from-[#FF3D00] to-[#FFD700] text-white hover:opacity-90">
                Start Game
              </Button>
            )}
          </Card>
        </div>
      </Layout>
    );
  }

  if (gameState === "ended") {
    const scorePercentage = (score / questions.length) * 100;

    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-6">
          <Card className="p-6 space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold">Game Over!</h1>
              <div className="text-4xl font-bold text-[#FF3D00]">
                Score: {score}/{questions.length} ({scorePercentage.toFixed(1)}%)
              </div>
              {finalTotalScore !== null && <div className="text-2xl font-bold text-[#FFD700] mt-2">Total Points: {finalTotalScore}</div>}
              {finalTotalTime !== null && <div className="text-md text-gray-400 mt-1">Total Time: {finalTotalTime.toFixed(1)} seconds</div>}
            </div>

            {!game.allowedLevels.includes("3") ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Prize Eligibility</h2>
                <p className="text-gray-600">Your score has been recorded for the leaderboard. Keep playing to improve your position and win prizes!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Bragging Rights</h2>
                <p className="text-gray-600">You've completed the ultimate challenge! Share your achievement with friends.</p>
              </div>
            )}

            <Button onClick={() => navigate("/levels")} className="w-full bg-gradient-to-r from-[#FF3D00] to-[#FFD700] text-white hover:opacity-90">
              Return to Levels
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-6 space-y-6">
          {/* Question Progress */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Timer Progress Bar */}
          <Progress value={(timeLeft / (game.timeLimit || 30)) * 100} className="h-2 bg-[#333]" />

          {/* Question Text */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{questions[currentQuestionIndex].text}</h2>
            {showHint && questions[currentQuestionIndex].hint && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800">{questions[currentQuestionIndex].hint}</p>
              </div>
            )}
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {questions[currentQuestionIndex].options?.map((option, index) => (
              <Button
                key={index}
                onClick={() => setSelectedAnswer(index.toString())}
                className={`w-full justify-start ${selectedAnswer === index.toString() ? "bg-[#FF3D00] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
              >
                {option}
              </Button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {game.enableHints && !showHint && (
              <Button variant="outline" onClick={() => setShowHint(true)} className="flex-1">
                <HelpCircle className="w-4 h-4 mr-2" />
                Show Hint
              </Button>
            )}
            <Button onClick={() => handleAnswerSubmit(selectedAnswer)} disabled={!selectedAnswer} className="flex-1 bg-gradient-to-r from-[#FF3D00] to-[#FFD700] text-white hover:opacity-90">
              Submit Answer
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default GamePlay;
