import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/ui/Layout";
import GameButton from "@/components/ui/GameButton";
import { useGame } from "@/context/GameContext";
import { Level } from "@/types";
import { getLevelDescription } from "@/lib/gameLogic";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Zap, LightbulbIcon, BrainCircuit } from "lucide-react";
import { getOrCreateGame } from "@/lib/gameDistribution";
import { toast } from "sonner";

const LevelSelect = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const [selectedLevels, setSelectedLevels] = useState<Level[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { player } = state;

  useEffect(() => {
    // Redirect to home if no player data exists
    if (!player?.id) {
      navigate("/");
      return;
    }
  }, [player, navigate]);

  // Get available levels based on player's highest level achieved
  const getAvailableLevels = () => {
    if (!player) return [];

    const highestLevel = player.highestLevelAchieved || 1;
    return [1, 2, 3].filter((level) => level >= highestLevel);
  };

  const toggleLevel = (level: Level) => {
    setError("");

    // If the level is already selected, deselect it
    if (selectedLevels.includes(level)) {
      setSelectedLevels([]);
      return;
    }

    // Check if the level is available
    const availableLevels = getAvailableLevels();
    if (!availableLevels.includes(level)) {
      setError("You must complete lower levels before attempting this level.");
      return;
    }

    // Otherwise, select the new level (replacing any existing selection)
    setSelectedLevels([level]);
  };

  const handleStartGame = async () => {
    if (selectedLevels.length === 0) {
      setError("Please select a level to play");
      return;
    }

    if (!player?.id) {
      toast.error("Please enter your name to start a game");
      navigate("/");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const selectedLevel = selectedLevels[0];

      // Find or create a suitable game
      const game = await getOrCreateGame({
        selectedLevels: [selectedLevel],
        playerName: player.name,
        playerId: player.id,
        preferredGameSize: 20,
        avoidRecentGames: true,
      });

      if (!game) {
        setError("Failed to find or create a game. Please try again.");
        return;
      }

      // Start a new game session
      dispatch({
        type: "START_SESSION",
        payload: {
          selectedLevels: [selectedLevel],
          gameId: game.id,
        },
      });

      // Navigate to game page
      navigate("/game");
    } catch (error) {
      console.error("Error starting game:", error);
      setError("An error occurred while starting the game. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const availableLevels = getAvailableLevels();

  return (
    <Layout>
      <div className="container py-10 relative min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="bttf-heading text-4xl md:text-5xl mb-6">Select Your Challenge</h1>
            <div className="inline-block bg-black/50 backdrop-blur px-6 py-3 rounded-lg border border-primary/20">
              <p className="text-primary font-mono text-sm md:text-base">CHOOSE YOUR TEMPORAL DESTINATION</p>
              <p className="text-xs text-muted-foreground mt-2">Select one level to test your knowledge</p>
            </div>
            {error && (
              <div className="mt-4 animate-pulse">
                <p className="text-destructive bg-destructive/20 inline-block px-4 py-2 rounded">{error}</p>
              </div>
            )}
          </div>

          <div className="grid gap-6 mb-10">
            {[1, 2, 3].map((level) => {
              const isAvailable = availableLevels.includes(level as Level);
              return <LevelCard key={level} level={level as Level} selected={selectedLevels.includes(level as Level)} onToggle={() => toggleLevel(level as Level)} isAvailable={isAvailable} />;
            })}
          </div>

          <div className="text-center">
            <GameButton onClick={handleStartGame} disabled={selectedLevels.length === 0 || isLoading} className="w-full md:w-auto">
              {isLoading ? "Finding Your Game..." : "Start Your Journey"}
            </GameButton>
          </div>
        </div>
      </div>
    </Layout>
  );
};

interface LevelCardProps {
  level: Level;
  selected: boolean;
  onToggle: () => void;
  isAvailable: boolean;
}

const LevelCard = ({ level, selected, onToggle, isAvailable }: LevelCardProps) => {
  const levelThemes = {
    1: {
      title: "Casual Time Traveler",
      color: "text-blue-400",
      border: "border-blue-400",
      bg: "bg-blue-500/10",
      glow: "rgba(59, 130, 246, 0.5)", // Blue glow
      icon: <Zap size={24} className="text-blue-400" />,
    },
    2: {
      title: "Temporal Expert",
      color: "text-yellow-400",
      border: "border-yellow-400",
      bg: "bg-yellow-500/10",
      glow: "rgba(234, 179, 8, 0.5)", // Yellow glow
      icon: <LightbulbIcon size={24} className="text-yellow-400" />,
    },
    3: {
      title: "Quantum Physicist",
      color: "text-purple-400",
      border: "border-purple-400",
      bg: "bg-purple-500/10",
      glow: "rgba(168, 85, 247, 0.5)", // Purple glow
      icon: <BrainCircuit size={24} className="text-purple-400" />,
    },
  };

  const theme = levelThemes[level];

  return (
    <Card
      className={`bttf-card transition-all duration-300 ${
        selected ? `${theme.border} ${theme.bg} animate-pulse` : isAvailable ? "border-primary/20 hover:border-primary cursor-pointer" : "border-gray-800/50 opacity-50 cursor-not-allowed"
      }`}
      onClick={isAvailable ? onToggle : undefined}
      style={{
        ...(selected && {
          boxShadow: `0 0 10px ${theme.glow}, 0 0 20px ${theme.glow}, inset 0 0 5px ${theme.glow}`,
        }),
      }}
    >
      <div className="flex items-start gap-4 p-6">
        <div className="mt-0.5">
          <Checkbox
            checked={selected}
            onCheckedChange={isAvailable ? () => onToggle() : undefined}
            className={`h-5 w-5 border-2 ${
              selected ? `${theme.border} ${theme.bg} data-[state=checked]:bg-current` : isAvailable ? "border-primary/40" : "border-gray-800/50"
            } transition-colors duration-200`}
            disabled={!isAvailable}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {theme.icon}
            <h3 className={`text-xl font-bold ${theme.color}`}>{theme.title}</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{getLevelDescription(level)}</p>

          <div className="flex flex-wrap gap-3">
            <div className={`px-3 py-1.5 backdrop-blur rounded-md border ${selected ? theme.border : isAvailable ? "border-primary/20" : "border-gray-800/50"} transition-colors duration-200`}>
              <span className="text-primary font-mono text-xs">{level * 100} POINTS/QUESTION</span>
            </div>
            <div className={`px-3 py-1.5 backdrop-blur rounded-md border ${selected ? theme.border : isAvailable ? "border-primary/20" : "border-gray-800/50"} transition-colors duration-200`}>
              <span className="text-primary font-mono text-xs">{30 + (level - 1) * 15}s TIME LIMIT</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LevelSelect;
