
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import GameButton from "@/components/ui/GameButton";
import { useGame } from "@/context/GameContext";
import { Level } from "@/types";
import { getLevelDescription } from "@/lib/gameLogic";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Flash, Zap } from "lucide-react";

const LevelSelect = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const [selectedLevels, setSelectedLevels] = useState<Level[]>([]);
  const [error, setError] = useState("");
  const { player } = state;
  
  useEffect(() => {
    // Redirect to home if no player is set
    if (!player) {
      navigate("/");
    }
  }, [player, navigate]);
  
  const toggleLevel = (level: Level) => {
    setError("");
    
    // Check if level is already selected
    if (selectedLevels.includes(level)) {
      setSelectedLevels(selectedLevels.filter(l => l !== level));
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
        playerName: player?.name || "Player",
        selectedLevels: sortedLevels
      }
    });
    
    // Navigate to game page
    navigate("/game");
  };
  
  return (
    <Layout>
      <div className="container py-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 animate-fade-in">
            <h1 className="bttf-heading text-3xl md:text-4xl mb-3 text-white">Select Your Levels</h1>
            <p className="text-muted-foreground">
              Choose up to 2 non-consecutive levels to test your Back to the Future knowledge
            </p>
            {error && <p className="text-red-500 mt-3">{error}</p>}
          </div>
          
          <div className="grid gap-6 mb-10">
            {[1, 2, 3].map((level) => (
              <LevelCard
                key={level}
                level={level as Level}
                selected={selectedLevels.includes(level as Level)}
                onToggle={() => toggleLevel(level as Level)}
              />
            ))}
          </div>
          
          <div className="flex justify-center mt-8">
            <GameButton
              onClick={handleStartGame}
              disabled={selectedLevels.length === 0}
            >
              Start Time Travel
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
  const levelColors = {
    1: "border-blue-400 bg-blue-500/10",
    2: "border-yellow-400 bg-yellow-500/10",
    3: "border-purple-400 bg-purple-500/10"
  };
  
  const levelIcons = {
    1: <Flash size={24} className="text-blue-400" />,
    2: <Zap size={24} className="text-yellow-400" />,
    3: <Flash size={24} className="text-purple-400" />
  };
  
  return (
    <Card 
      className={`p-6 cursor-pointer transition-all duration-300 border-2 ${selected ? levelColors[level] + ' animate-pulse' : 'border-muted'} ${selected ? 'shadow-[0_0_15px_rgba(0,163,255,0.7)]' : ''} hover:border-bttf-blue`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5">
          <Checkbox 
            checked={selected}
            onCheckedChange={() => onToggle()}
            className="data-[state=checked]:bg-bttf-blue data-[state=checked]:border-bttf-blue"
          />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {levelIcons[level]}
            <h3 className="text-xl font-bold">Level {level}</h3>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">{getLevelDescription(level)}</p>
          
          <div className="mt-2 flex items-center gap-3">
            <div className="px-2 py-1 bg-muted rounded text-xs">
              {(level * 100)} pts per question
            </div>
            <div className="px-2 py-1 bg-muted rounded text-xs">
              {30 + (level - 1) * 15}s time limit
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LevelSelect;
