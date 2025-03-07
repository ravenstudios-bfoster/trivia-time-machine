
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import GameButton from "@/components/ui/GameButton";
import { useGame } from "@/context/GameContext";
import { toast } from "sonner";
import { Clock } from "lucide-react";

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
    navigate("/admin");
    toast.info("Accessing admin area...", {
      description: "This area is for game administrators only."
    });
  };
  
  return (
    <div 
      className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 overflow-hidden bg-gradient-to-b from-gray-900 via-blue-900 to-black"
    >
      {/* Lightning Effect Background */}
      <div className="absolute inset-0 -z-10">
        <div className="w-full h-full opacity-20 bg-[linear-gradient(#0000_1px,#2080ff10_1px),linear-gradient(90deg,#0000_1px,#2080ff10_1px)] bg-[size:20px_20px]"></div>
        <div className="absolute inset-0 animate-lightning-flash opacity-0 bg-blue-400/20"></div>
      </div>
      
      {/* Main Content */}
      <div className="w-full max-w-4xl mx-auto text-center">
        {/* BTTF Logo */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <h1 
              className="text-5xl md:text-7xl mb-2 font-extrabold tracking-tighter bg-gradient-to-br from-amber-400 to-orange-600 text-transparent bg-clip-text drop-shadow-[0_2px_10px_rgba(255,122,0,0.5)]"
              onDoubleClick={handleTitleDoubleClick}
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              BACK TO THE<br/>FUTURE
            </h1>
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-pulse"></div>
            <h2 className="text-2xl md:text-3xl text-blue-300 mt-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Tom's 50th Birthday Challenge
            </h2>
          </div>
        </div>
        
        {/* Time Circuits Display */}
        <div className="mb-10 grid grid-cols-3 gap-2 max-w-xl mx-auto">
          {["DESTINATION", "PRESENT", "LAST TIME DEPARTED"].map((label, i) => (
            <div key={i} className="bg-black border border-gray-700 p-2 rounded-sm">
              <div className="text-xs text-red-500 font-bold mb-1">{label}</div>
              <div className="bg-red-900/80 p-1 rounded-sm flex justify-center items-center font-mono text-red-500 animate-time-circuit">
                {i === 0 ? "SEP 01 2023" : i === 1 ? "OCT 26 2023" : "NOV 05 2023"}
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-black/60 backdrop-blur-md border-2 border-blue-600/30 rounded-lg p-8 mb-10 mx-auto max-w-md shadow-[0_0_25px_rgba(0,100,255,0.6)]">
          <h2 className="text-2xl font-bold mb-6 text-center text-blue-400 flex items-center justify-center gap-2">
            <Clock className="h-6 w-6 text-blue-400" />
            <span>ENTER THE DeLOREAN</span>
          </h2>
          
          <div className="mb-6">
            <Input
              type="text"
              placeholder="Enter your name, McFly!"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                if (e.target.value.trim()) setNameError("");
              }}
              className="text-lg p-4 bg-black/30 border-blue-500/50 focus:border-blue-400 text-white placeholder:text-blue-300/70"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleStartGame();
              }}
            />
            
            {nameError && <p className="text-red-500 mt-2">{nameError}</p>}
          </div>
          
          <div className="flex flex-col space-y-4">
            <GameButton onClick={handleStartGame} fullWidth>Start Time Travel</GameButton>
            
            <div className="text-center text-sm text-blue-300 mt-4">
              <p className="italic">
                "Your future is whatever you make it, so make it a good one!"
              </p>
              <p className="mt-2 text-gray-400">
                Test your knowledge of Back to the Future!
              </p>
            </div>
          </div>
        </div>
        
        {/* DeLorean Illustration */}
        <div className="relative w-80 md:w-96 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent -bottom-4 z-10"></div>
          <div className="animate-hover-float">
            <svg viewBox="0 0 240 100" className="w-full">
              {/* DeLorean Body */}
              <rect x="30" y="60" width="160" height="20" rx="5" fill="#222" stroke="#555" strokeWidth="1" />
              <rect x="20" y="55" width="180" height="10" rx="2" fill="#333" stroke="#666" strokeWidth="1" />
              <rect x="40" y="50" width="140" height="10" rx="2" fill="#444" stroke="#777" strokeWidth="1" />
              
              {/* Windows */}
              <rect x="50" y="43" width="30" height="9" rx="1" fill="#88ccff" stroke="#aaddff" strokeWidth="1" opacity="0.7" />
              <rect x="90" y="43" width="60" height="9" rx="1" fill="#88ccff" stroke="#aaddff" strokeWidth="1" opacity="0.7" />
              <rect x="160" y="43" width="30" height="9" rx="1" fill="#88ccff" stroke="#aaddff" strokeWidth="1" opacity="0.7" />
              
              {/* Wheels */}
              <circle cx="60" cy="80" r="10" fill="#111" stroke="#333" strokeWidth="2" />
              <circle cx="60" cy="80" r="5" fill="#222" />
              <circle cx="180" cy="80" r="10" fill="#111" stroke="#333" strokeWidth="2" />
              <circle cx="180" cy="80" r="5" fill="#222" />
              
              {/* Flux Capacitor Glow */}
              <circle cx="120" cy="55" r="15" fill="url(#flux-glow)" className="animate-flux-capacitor" />
              
              {/* Lights */}
              <circle cx="50" cy="60" r="5" fill="#ffcc00" className="animate-pulse" opacity="0.8" />
              <circle cx="190" cy="60" r="5" fill="#ffcc00" className="animate-pulse" opacity="0.8" />
              
              {/* Exhaust flames */}
              <path d="M10,70 Q5,72 1,65 Q5,68 10,70" fill="#ff7700" className="animate-pulse" />
              <path d="M10,75 Q0,80 5,85 Q8,80 10,75" fill="#ff3300" className="animate-pulse" />
              
              {/* Gradients for effects */}
              <defs>
                <radialGradient id="flux-glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor="#00ffff" stopOpacity="1" />
                  <stop offset="50%" stopColor="#0088ff" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#0000ff" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>
        
        <div className="text-gray-400 text-xs mt-8">
          "Roads? Where we're going, we don't need roads."
        </div>
      </div>
    </div>
  );
};

export default Index;
