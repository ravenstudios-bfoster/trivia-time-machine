
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import GameButton from "@/components/ui/GameButton";
import { useGame } from "@/context/GameContext";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const [playerName, setPlayerName] = useState("");
  const [nameError, setNameError] = useState("");
  
  const handleStartGame = () => {
    if (!playerName.trim()) {
      setNameError("Please enter your name to continue");
      return;
    }
    
    // Set player in game context
    dispatch({ 
      type: "SET_PLAYER", 
      payload: { 
        id: `player_${Date.now()}`,
        name: playerName,
        sessions: []
      }
    });
    
    // Navigate to level selection
    navigate("/levels");
    toast.success(`Welcome, ${playerName}! Let's play!`);
  };

  // Secret admin access - double click on title
  const handleTitleDoubleClick = () => {
    // Secret admin path - only obvious to someone who knows to double-click the title
    navigate("/admin");
    toast.info("Accessing admin area...", {
      description: "This area is for game administrators only."
    });
  };
  
  return (
    <div 
      className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 overflow-hidden"
    >
      {/* Grid Background Effect */}
      <div className="absolute inset-0 -z-10 bg-gray-900">
        <div className="w-full h-full opacity-30 bg-[linear-gradient(#0000_1px,#2080ff10_1px),linear-gradient(90deg,#0000_1px,#2080ff10_1px)] bg-[size:20px_20px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
      </div>
      
      {/* Main Content */}
      <div className="w-full max-w-3xl mx-auto text-center">
        <div className="mb-12 animate-fade-in">
          <h1 
            className="text-4xl md:text-6xl mb-2 font-bold bg-gradient-to-br from-amber-400 to-orange-600 text-transparent bg-clip-text drop-shadow-[0_2px_10px_rgba(255,122,0,0.3)]"
            onDoubleClick={handleTitleDoubleClick}
          >
            TRIVIA TIME MACHINE
          </h1>
          <h2 className="text-xl md:text-2xl text-blue-300">Tom's 50th Birthday Challenge</h2>
        </div>
        
        <div className="bg-black/40 backdrop-blur-sm border border-blue-500/30 rounded-lg p-6 mb-8 mx-auto max-w-md shadow-[0_0_15px_rgba(0,100,255,0.5)]">
          <h2 className="text-xl font-bold mb-6 text-center text-blue-400">Enter The DeLorean</h2>
          
          <div className="mb-6">
            <Input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                if (e.target.value.trim()) setNameError("");
              }}
              className="text-lg p-4 bg-black/30 border-blue-500/50 focus:border-blue-400"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleStartGame();
              }}
            />
            
            {nameError && <p className="text-red-500 mt-2">{nameError}</p>}
          </div>
          
          <div className="flex flex-col space-y-4">
            <GameButton onClick={handleStartGame} fullWidth>Start Game</GameButton>
            
            <div className="text-center text-sm text-gray-400 mt-4">
              <p>Test your knowledge of Back to the Future<br />Win points and prove you're the ultimate fan!</p>
            </div>
          </div>
        </div>
        
        <div className="relative w-64 md:w-80 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent -bottom-6 z-10"></div>
          <div className="animate-pulse">
            <svg viewBox="0 0 200 100" className="w-full">
              <path d="M10,70 L60,70 L70,50 L130,50 L140,70 L190,70" 
                    fill="none" 
                    stroke="rgb(59, 130, 246)" 
                    strokeWidth="2"
                    className="animate-glow" />
              <rect x="40" y="60" width="120" height="30" rx="5" fill="#111827" stroke="rgb(59, 130, 246)" strokeWidth="1" />
              <rect x="45" y="65" width="110" height="20" rx="3" fill="#1f2937" />
              <circle cx="50" cy="50" r="10" fill="rgb(59, 130, 246)" className="animate-pulse opacity-80" />
              <circle cx="150" cy="50" r="10" fill="rgb(59, 130, 246)" className="animate-pulse opacity-80" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
