import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import GameButton from "@/components/ui/GameButton";
import { useGame } from "@/context/GameContext";
import { Level } from "@/types";
import { getLevelDescription } from "@/lib/gameLogic";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Zap, LightbulbIcon, BrainCircuit } from "lucide-react";

const LevelSelect = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const [selectedLevels, setSelectedLevels] = useState<Level[]>([]);
  const [error, setError] = useState("");
  const { player } = state;

  useEffect(() => {
    // Redirect to home if no player data exists
    if (!player?.id) {
      navigate("/");
      return;
    }
  }, [player, navigate]);

  const toggleLevel = (level: Level) => {
    setError("");

    // Check if level is already selected
    if (selectedLevels.includes(level)) {
      setSelectedLevels(selectedLevels.filter((l) => l !== level));
      return;
    }

    // Check if trying to add a consecutive level
    if (selectedLevels.length === 1) {
      const currentLevel = selectedLevels[0];
      if (Math.abs(currentLevel - level) === 1) {
        setError("You cannot select consecutive levels. Choose levels that are not adjacent.");
        return;
      }
    }

    // Add level if less than 2 are selected
    if (selectedLevels.length < 2) {
      setSelectedLevels([...selectedLevels, level]);
    } else {
      setError("You can only select 2 levels. Deselect one to choose another.");
    }
  };

  const handleStartGame = () => {
    if (selectedLevels.length === 0) {
      setError("Please select at least one level to play");
      return;
    }

    // Sort levels in ascending order
    const sortedLevels = [...selectedLevels].sort((a, b) => a - b);

    // Start a new game session
    dispatch({
      type: "START_SESSION",
      payload: {
        selectedLevels: sortedLevels,
      },
    });

    // Navigate to game page
    navigate("/game");
  };

  return (
    <Layout>
      <div className="container py-10 relative min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="bttf-heading text-4xl md:text-5xl mb-6">Select Your Challenge</h1>
            <div className="inline-block bg-black/50 backdrop-blur px-6 py-3 rounded-lg border border-primary/20">
              <p className="text-primary font-mono text-sm md:text-base">CHOOSE YOUR TEMPORAL DESTINATIONS</p>
              <p className="text-xs text-muted-foreground mt-2">Select up to 2 non-consecutive levels to test your knowledge</p>
            </div>
            {error && (
              <div className="mt-4 animate-pulse">
                <p className="text-destructive bg-destructive/20 inline-block px-4 py-2 rounded">{error}</p>
              </div>
            )}
          </div>

          <div className="grid gap-6 mb-10">
            {[1, 2, 3].map((level) => (
              <LevelCard key={level} level={level as Level} selected={selectedLevels.includes(level as Level)} onToggle={() => toggleLevel(level as Level)} />
            ))}
          </div>

          <div className="flex justify-center mt-12">
            <GameButton onClick={handleStartGame} disabled={selectedLevels.length === 0} className="bttf-glow text-lg px-8 py-4">
              <span className="relative">
                <span className="absolute inset-0 animate-pulse opacity-50 bg-primary/20 rounded-lg" />
                <span className="relative">Start Challenge</span>
              </span>
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
}

const LevelCard = ({ level, selected, onToggle }: LevelCardProps) => {
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
      className={`bttf-card cursor-pointer transition-all duration-300 ${selected ? `${theme.border} ${theme.bg} animate-pulse` : "border-primary/20"} hover:border-primary relative`}
      onClick={onToggle}
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
            onCheckedChange={() => onToggle()}
            className={`h-5 w-5 border-2 ${selected ? `${theme.border} ${theme.bg} data-[state=checked]:bg-current` : "border-primary/40"} transition-colors duration-200`}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {theme.icon}
            <h3 className={`text-xl font-bold ${theme.color}`}>{theme.title}</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{getLevelDescription(level)}</p>

          <div className="flex flex-wrap gap-3">
            <div className={`px-3 py-1.5 backdrop-blur rounded-md border ${selected ? theme.border : "border-primary/20"} transition-colors duration-200`}>
              <span className="text-primary font-mono text-xs">{level * 100} POINTS/QUESTION</span>
            </div>
            <div className={`px-3 py-1.5 backdrop-blur rounded-md border ${selected ? theme.border : "border-primary/20"} transition-colors duration-200`}>
              <span className="text-primary font-mono text-xs">{30 + (level - 1) * 15}s TIME LIMIT</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LevelSelect;
