import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import GameButton from "@/components/ui/GameButton";
import TimeCircuitDisplay from "@/components/TimeCircuitDisplay";
import { createOrUpdateUser, validateAccessCode } from "@/lib/firebase";
import { toast } from "sonner";

const PARTY_CODE = "OUTATIME88"; // This would be configured by admin/Tom

const Auth = () => {
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    code: "",
  });
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Hey McFly! Fill in all fields to continue!");
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("That email looks about as real as a hoverboard in 1955!");
      return;
    }

    // Show code verification screen
    setShowCode(true);
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsVerifying(true);

    try {
      if (!formData.code.trim()) {
        setError("You need the Flux Capacitor code to time travel!");
        setIsVerifying(false);
        return;
      }

      // Validate access code
      const isValidCode = await validateAccessCode(formData.code.trim());
      if (!isValidCode) {
        setError("Great Scott! That's not the right code or it has expired. Check with Doc Brown!");
        setIsVerifying(false);
        return;
      }

      // Create or update user in Firebase
      const user = await createOrUpdateUser({
        displayName: formData.name.trim(),
        email: formData.email.trim(),
      });

      // Create player session
      dispatch({
        type: "SET_PLAYER",
        payload: {
          id: user.id,
          name: user.displayName,
          email: user.email,
          sessions: [],
        },
      });

      toast.success(`Welcome, ${user.displayName}! Let's travel through time!`);
      navigate("/levels");
    } catch (error) {
      console.error("Error during verification:", error);
      setError("Temporal displacement malfunction! Please try again.");
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background with DeLorean silhouette */}
      <div className="absolute inset-0 bg-[url('/images/delorean-bg.png')] bg-center bg-cover bg-no-repeat opacity-20" style={{ backgroundBlendMode: "overlay" }} />

      <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-background" />

      <div className="container relative z-10 py-10 px-4 min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-lg w-full mx-auto text-center">
          {/* Title */}
          <img src="/images/logo.png" alt="Back to the Future" className="w-full max-w-md mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl mb-12 text-primary/80 font-mono">Tom's 50th Birthday Challenge</h2>

          {/* Time Circuit Display */}
          <div className="mb-12">
            <TimeCircuitDisplay />
          </div>

          <Card className="bg-black/40 backdrop-blur border-primary/20 p-8">
            {!showCode ? (
              // Initial Entry Screen
              <form onSubmit={handleInitialSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl text-primary font-mono mb-6">ENTER THE DeLOREAN</h3>
                  <Input
                    type="text"
                    placeholder="Your name, McFly!"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-black/30 border-primary/20 font-mono text-center text-lg placeholder:text-primary/40"
                  />
                  <Input
                    type="email"
                    placeholder="Your email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-black/30 border-primary/20 font-mono text-center text-lg placeholder:text-primary/40"
                  />
                </div>

                {error && <div className="text-destructive text-center bg-destructive/20 py-2 px-3 rounded animate-pulse">{error}</div>}

                <GameButton type="submit" className="w-full bttf-glow text-lg">
                  Start Time Travel
                </GameButton>
              </form>
            ) : (
              // Code Entry Screen
              <form onSubmit={handleCodeSubmit} className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl text-primary font-mono mb-2">FLUX CAPACITOR VERIFICATION</h3>
                  <p className="text-primary/60 text-sm mb-6">Enter Tom's secret code to power up the flux capacitor</p>
                  <Input
                    type="text"
                    placeholder="Enter the secret code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="bg-black/30 border-primary/20 font-mono text-center text-lg placeholder:text-primary/40"
                  />
                </div>

                {error && <div className="text-destructive text-center bg-destructive/20 py-2 px-3 rounded animate-pulse">{error}</div>}

                <div className="flex gap-4">
                  <GameButton
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowCode(false);
                      setFormData({ ...formData, code: "" });
                      setError("");
                    }}
                  >
                    Go Back
                  </GameButton>
                  <GameButton type="submit" className="flex-1 bttf-glow" disabled={isVerifying}>
                    {isVerifying ? "Verifying..." : "Power Up"}
                  </GameButton>
                </div>
              </form>
            )}

            <div className="mt-8 text-center text-primary/60 font-mono text-sm italic">"Your future is whatever you make it, so make it a good one!"</div>

            <div className="mt-4 text-center text-primary/40 text-xs">Test your knowledge of Back to the Future!</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
