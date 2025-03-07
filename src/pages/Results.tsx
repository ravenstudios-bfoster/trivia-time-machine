
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import ScoreDisplay from "@/components/ui/ScoreDisplay";
import GameButton from "@/components/ui/GameButton";
import { useGame } from "@/context/GameContext";
import { calculateSuccessRate } from "@/lib/gameLogic";
import { Card } from "@/components/ui/card";
import { Check, X, Clock, Lightbulb } from "lucide-react";

const Results = () => {
  const navigate = useNavigate();
  const { state } = useGame();
  const { currentSession, questions } = state;
  
  useEffect(() => {
    // Redirect if no completed session
    if (!currentSession || !currentSession.isCompleted) {
      navigate("/");
    }
  }, [currentSession, navigate]);
  
  const handlePlayAgain = () => {
    navigate("/levels");
  };
  
  if (!currentSession) {
    return null;
  }
  
  const { answers, totalScore } = currentSession;
  
  // Get question details for each answer
  const answeredQuestions = answers.map(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    return { answer, question };
  });
  
  // Calculate stats
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const successRate = calculateSuccessRate(answers);
  const hintsUsed = answers.filter(a => a.usedHint).length;
  
  return (
    <Layout>
      <div className="container py-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 animate-fade-in">
            <h1 className="text-4xl font-bold mb-2" 
                style={{
                  background: 'linear-gradient(to bottom right, #FF7A00, #FFC72C)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 10px rgba(255, 122, 0, 0.3)'
                }}>
              Time Travel Complete!
            </h1>
            <p className="text-xl text-muted-foreground">
              Great job, {currentSession.playerName}!
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <ScoreDisplay
              score={totalScore}
              correctAnswers={correctAnswers}
              totalQuestions={answers.length}
              className="h-full"
            />
            
            <Card className="flux-container h-full">
              <h3 className="text-xl font-['Orbitron'] text-center mb-4 text-bttf-pink">Performance Stats</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-muted pb-2">
                  <span className="font-medium flex items-center">
                    <Check size={18} className="text-green-400 mr-2" />
                    Success Rate:
                  </span>
                  <span className="font-bold">{successRate}%</span>
                </div>
                
                <div className="flex justify-between items-center border-b border-muted pb-2">
                  <span className="font-medium flex items-center">
                    <X size={18} className="text-red-400 mr-2" />
                    Incorrect Answers:
                  </span>
                  <span className="font-bold">{answers.length - correctAnswers}</span>
                </div>
                
                <div className="flex justify-between items-center border-b border-muted pb-2">
                  <span className="font-medium flex items-center">
                    <Lightbulb size={18} className="text-yellow-400 mr-2" />
                    Hints Used:
                  </span>
                  <span className="font-bold">{hintsUsed}</span>
                </div>
                
                <div className="flex justify-between items-center border-b border-muted pb-2">
                  <span className="font-medium flex items-center">
                    <Clock size={18} className="text-blue-400 mr-2" />
                    Levels Completed:
                  </span>
                  <span className="font-bold">{currentSession.selectedLevels.length}</span>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 bttf-heading text-bttf-blue">Answer Review</h2>
            
            <div className="space-y-4">
              {answeredQuestions.map(({ answer, question }) => (
                question && (
                  <Card key={answer.questionId} className="p-4 border-l-4 border-l-bttf-blue">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold">Level {question.level} Question</span>
                      <span className={answer.isCorrect ? "text-green-400" : "text-red-400"}>
                        {answer.isCorrect ? 
                          <span className="flex items-center"><Check size={16} className="mr-1" /> Correct</span> : 
                          <span className="flex items-center"><X size={16} className="mr-1" /> Incorrect</span>}
                      </span>
                    </div>
                    
                    <p className="mb-2">{question.text}</p>
                    
                    {answer.isCorrect ? (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Points earned: </span>
                        <span className="font-bold">{answer.pointsEarned}</span>
                        {answer.usedHint && (
                          <span className="text-yellow-400 ml-2 text-xs">
                            (Used hint: -{question.hintPenalty} pts)
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm mt-2">
                        <div className="text-muted-foreground mb-1">Correct answer:</div>
                        <div className="font-medium">
                          {question.type === 'write-in' 
                            ? question.correctAnswer
                            : question.options?.find(o => o.isCorrect)?.text}
                        </div>
                      </div>
                    )}
                  </Card>
                )
              ))}
            </div>
          </div>
          
          <div className="flex justify-center">
            <GameButton onClick={handlePlayAgain}>
              Play Again
            </GameButton>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Results;
