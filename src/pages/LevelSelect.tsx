import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/ui/Layout";
import GameButton from "@/components/ui/GameButton";
import { useGame } from "@/context/GameContext";
import { Level } from "@/types";
import { getLevelDescription } from "@/lib/gameLogic";
import { Card } from "@/components/ui/card";
import { Zap, LightbulbIcon, BrainCircuit } from "lucide-react";
import { getOrCreateGame } from "@/lib/gameDistribution";
import { toast } from "sonner";

const LevelSelect = () => {
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartGame = async (level: Level) => {
    setIsLoading(true);
    try {
      // Find or create a suitable game
      const game = await getOrCreateGame({
        selectedLevels: [level],
        playerName: "Player", // This isn't used for matching anymore
        playerId: "system", // This isn't used for matching anymore
        preferredGameSize: 20,
        avoidRecentGames: true,
      });

      if (!game) {
        toast.error("Failed to find or create a game. Please try again.");
        return;
      }

      // Start a new game session
      dispatch({
        type: "START_SESSION",
        payload: {
          selectedLevels: [level],
          gameId: game.id,
        },
      });

      // Navigate to game page
      navigate("/game");
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("An error occurred while starting the game. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const levels: Level[] = [1, 2, 3];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Select Your Level</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {levels.map((level) => (
            <Card key={level} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleStartGame(level)}>
              <div className="flex flex-col items-center text-center space-y-4">
                {level === 1 && <Zap className="w-12 h-12 text-yellow-500" />}
                {level === 2 && <LightbulbIcon className="w-12 h-12 text-blue-500" />}
                {level === 3 && <BrainCircuit className="w-12 h-12 text-purple-500" />}
                <h2 className="text-2xl font-bold">Level {level}</h2>
                <p className="text-muted-foreground">{getLevelDescription(level)}</p>
                <GameButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartGame(level);
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Start Game"}
                </GameButton>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default LevelSelect;
