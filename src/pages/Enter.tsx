import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/ui/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import GameButton from "@/components/ui/GameButton";
import { useGame } from "@/context/GameContext";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { Timestamp } from "firebase/firestore";

const Enter = () => {
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const [playerName, setPlayerName] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      setEmailError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailError("");
    setIsVerifying(true);

    try {
      // TODO: Implement email verification code sending
      // For now, we'll simulate it with a fixed code
      setCodeSent(true);
      toast.success("Verification code sent to your email!");
    } catch (error) {
      toast.error("Failed to send verification code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleStartGame = async () => {
    // Validate name
    if (!playerName.trim()) {
      setNameError("Please enter your name to continue");
      return;
    }
    setNameError("");

    // Validate email
    if (!email.trim()) {
      setEmailError("Please enter your email address");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");

    // Validate verification code
    if (!verificationCode.trim()) {
      setCodeError("Please enter the verification code");
      return;
    }
    if (verificationCode !== "1985") {
      // TODO: Replace with actual verification
      setCodeError("Invalid verification code");
      return;
    }
    setCodeError("");

    // Set player in game context
    dispatch({
      type: "SET_PLAYER",
      payload: {
        id: `player_${Date.now()}`,
        name: playerName,
        email: email,
        sessions: [],
        highestLevelAchieved: 1,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
    });

    // Navigate to level selection
    navigate("/levels");
    toast.success(`Welcome, ${playerName}! Let's begin your time travel adventure!`);
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="bg-black/60 backdrop-blur-md border-2 border-blue-600/30 p-8 shadow-[0_0_25px_rgba(0,100,255,0.6)]">
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-400 flex items-center justify-center gap-2">
              <Clock className="h-6 w-6 text-blue-400" />
              <span>ENTER THE DeLOREAN</span>
            </h2>

            <div className="space-y-4">
              <div>
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
                />
                {nameError && <p className="text-red-500 mt-2 text-sm">{nameError}</p>}
              </div>

              <div>
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (e.target.value.trim()) setEmailError("");
                  }}
                  className="text-lg p-4 bg-black/30 border-blue-500/50 focus:border-blue-400 text-white placeholder:text-blue-300/70"
                />
                {emailError && <p className="text-red-500 mt-2 text-sm">{emailError}</p>}
              </div>

              {!codeSent ? (
                <GameButton onClick={handleSendCode} disabled={isVerifying} className="w-full">
                  {isVerifying ? "Sending Code..." : "Send Verification Code"}
                </GameButton>
              ) : (
                <div>
                  <Input
                    type="text"
                    placeholder="Enter verification code"
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value);
                      if (e.target.value.trim()) setCodeError("");
                    }}
                    className="text-lg p-4 bg-black/30 border-blue-500/50 focus:border-blue-400 text-white placeholder:text-blue-300/70"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleStartGame();
                    }}
                  />
                  {codeError && <p className="text-red-500 mt-2 text-sm">{codeError}</p>}
                </div>
              )}

              {codeSent && (
                <GameButton onClick={handleStartGame} className="w-full">
                  Start Time Travel
                </GameButton>
              )}

              <div className="text-center text-sm text-blue-300 mt-4">
                <p className="italic">"Your future is whatever you make it, so make it a good one!"</p>
                <p className="mt-2 text-gray-400">Test your knowledge of Back to the Future!</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Enter;
