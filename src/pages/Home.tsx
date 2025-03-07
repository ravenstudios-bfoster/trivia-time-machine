
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import GameButton from "@/components/ui/GameButton";
import { Input } from "@/components/ui/input";
import { useGame } from "@/context/GameContext";

const Home = () => {
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
  };
  
  return (
    <Layout showFooter={false} transparentHeader>
      <div 
        className="relative min-h-[calc(100vh-64px)] w-full flex flex-col items-center justify-center p-6 overflow-hidden"
      >
        {/* Grid Background Effect */}
        <div className="absolute inset-0 -z-10">
          <div className="w-full h-full grid-background opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
        
        {/* Main Content */}
        <div className="w-full max-w-3xl mx-auto text-center">
          <div className="mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-6xl mb-2 font-bold" 
                style={{
                  background: 'linear-gradient(to bottom right, #FF7A00, #FFC72C)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 10px rgba(255, 122, 0, 0.3)'
                }}>
              TRIVIA TIME MACHINE
            </h1>
            <h2 className="text-xl md:text-2xl chrome-text">Tom's 50th Birthday Challenge</h2>
          </div>
          
          <div className="flux-container mb-8 mx-auto max-w-md animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl font-bold mb-6 text-center bttf-heading text-bttf-blue">Enter The DeLorean</h2>
            
            <div className="mb-6">
              <Input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  if (e.target.value.trim()) setNameError("");
                }}
                className="text-lg p-4 bg-black/30 border-bttf-silver focus:border-bttf-blue"
                autoFocus
              />
              
              {nameError && <p className="text-red-500 mt-2">{nameError}</p>}
            </div>
            
            <div className="flex flex-col space-y-4">
              <GameButton onClick={handleStartGame} fullWidth>Start Game</GameButton>
              
              <div className="text-center text-sm text-muted-foreground mt-4">
                <p>Test your knowledge of Back to the Future<br />Win points and prove you're the ultimate fan!</p>
              </div>
            </div>
          </div>
          
          <div className="animate-hover-float" style={{ animationDelay: '0.4s' }}>
            <img 
              src="/public/lovable-uploads/9f6aabdb-e642-4127-a49d-c5b5e2931e0b.png" 
              alt="DeLorean Time Machine" 
              className="mx-auto max-w-full w-64 md:w-80"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
