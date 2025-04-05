import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import ScoreDisplay from "@/components/ui/ScoreDisplay";
import GameButton from "@/components/ui/GameButton";
import { useGame } from "@/context/GameContext";
import { calculateSuccessRate, getLevelDescription } from "@/lib/gameLogic";
import { Card } from "@/components/ui/card";
import { Check, X, Clock, Lightbulb, ArrowRight } from "lucide-react";

const Results = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { currentSession, player, questions } = state;

  useEffect(() => {
    // Redirect if no completed session
    if (!currentSession || !currentSession.isCompleted) {
      navigate("/");
    }
  }, [currentSession, navigate]);

  const handlePlayAgain = () => {
    // Clear the current session
    dispatch({ type: "CLEAR_SESSION" });
    navigate("/levels");
  };

  // Calculate results and stats
  const results = useMemo(() => {
    if (!currentSession || !questions.length) return null;

    const { answers, score } = currentSession;

    // Get question details for each answer
    const answeredQuestions = answers
      .map((answer) => {
        const question = questions.find((q) => q.id === answer.questionId);
        return { answer, question };
      })
      .filter((item) => item.question); // Filter out any null questions

    // Calculate stats
    const totalQuestions = answeredQuestions.length;
    const correctAnswers = answeredQuestions.filter(({ question, answer }) => {
      // Find the question's correct answer
      return answer.pointsEarned > 0;
    }).length;

    const successRate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Group by level
    const levelStats = currentSession.selectedLevels.reduce((acc, level) => {
      const levelQuestions = answeredQuestions.filter(({ question }) => question?.level === level);

      const levelCorrect = levelQuestions.filter(({ answer }) => answer.pointsEarned > 0).length;

      acc[level] = {
        total: levelQuestions.length,
        correct: levelCorrect,
        successRate: levelQuestions.length > 0 ? Math.round((levelCorrect / levelQuestions.length) * 100) : 0,
      };

      return acc;
    }, {} as Record<number, { total: number; correct: number; successRate: number }>);

    return {
      playerName: player?.name || "Time Traveler",
      totalScore: score,
      totalQuestions,
      correctAnswers,
      successRate,
      levelStats,
      answeredQuestions,
    };
  }, [currentSession, questions, player]);

  if (!currentSession || !results) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 animate-fade-in">
            <h1
              className="text-4xl font-bold mb-2 bttf-heading"
              style={{
                background: "linear-gradient(to bottom right, #FF7A00, #FFC72C)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 2px 10px rgba(255, 122, 0, 0.3)",
              }}
            >
              Time Travel Complete!
            </h1>
            <p className="text-xl text-muted-foreground">Great job, {results.playerName}!</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <ScoreDisplay score={results.totalScore} correctAnswers={results.correctAnswers} totalQuestions={results.totalQuestions} className="h-full" />

            <Card className="flux-container h-full p-6">
              <h3 className="text-xl font-['Orbitron'] text-center mb-4 text-bttf-pink">Performance Stats</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-muted pb-2">
                  <span className="font-medium flex items-center">
                    <Check size={18} className="text-green-400 mr-2" />
                    Success Rate:
                  </span>
                  <span className="font-bold">{results.successRate}%</span>
                </div>

                <div className="flex justify-between items-center border-b border-muted pb-2">
                  <span className="font-medium flex items-center">
                    <X size={18} className="text-red-400 mr-2" />
                    Incorrect Answers:
                  </span>
                  <span className="font-bold">{results.totalQuestions - results.correctAnswers}</span>
                </div>

                <div className="flex justify-between items-center border-b border-muted pb-2">
                  <span className="font-medium flex items-center">
                    <Clock size={18} className="text-blue-400 mr-2" />
                    Levels Completed:
                  </span>
                  <span className="font-bold">{currentSession.selectedLevels.length}</span>
                </div>
              </div>

              {/* Level Breakdown */}
              <h4 className="text-lg font-medium mt-4 mb-2">Level Breakdown:</h4>
              <div className="space-y-2">
                {currentSession.selectedLevels.map((level) => (
                  <div key={level} className="border-l-2 border-bttf-blue pl-3">
                    <div className="text-sm font-medium">
                      Level {level}: {getLevelDescription(level)}
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>
                        {results.levelStats[level]?.correct || 0}/{results.levelStats[level]?.total || 0} correct
                      </span>
                      <span className={results.levelStats[level]?.successRate > 70 ? "text-green-400" : "text-yellow-400"}>{results.levelStats[level]?.successRate || 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 bttf-heading text-bttf-blue">Answer Review</h2>

            <div className="space-y-4">
              {results.answeredQuestions.map(
                ({ answer, question }) =>
                  question && (
                    <Card key={answer.questionId} className={`p-4 ${answer.pointsEarned > 0 ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"}`}>
                      <div className="flex justify-between mb-2">
                        <span className="font-bold">Level {question.level} Question</span>
                        <span className={answer.pointsEarned > 0 ? "text-green-400" : "text-red-400"}>
                          {answer.pointsEarned > 0 ? (
                            <span className="flex items-center">
                              <Check size={16} className="mr-1" /> Correct
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <X size={16} className="mr-1" /> Incorrect
                            </span>
                          )}
                        </span>
                      </div>

                      <p className="mb-2">{question.text}</p>

                      {answer.pointsEarned > 0 ? (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Points earned: </span>
                          <span className="font-bold">{answer.pointsEarned}</span>
                        </div>
                      ) : (
                        <div className="text-sm mt-2">
                          <div className="text-muted-foreground mb-1">Correct answer:</div>
                          <div className="font-medium">{typeof question.correctAnswer === "string" ? question.correctAnswer : question.options?.[question.correctAnswer]}</div>
                        </div>
                      )}
                    </Card>
                  )
              )}
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <GameButton onClick={handlePlayAgain}>Play Again</GameButton>

            <GameButton onClick={() => navigate("/")} variant="outline">
              Home
              <ArrowRight className="w-4 h-4 ml-2" />
            </GameButton>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Results;
