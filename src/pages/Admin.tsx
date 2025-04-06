import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/ui/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGame } from "@/context/GameContext";
import { toast } from "sonner";

const Admin = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const { state } = useGame();

  // Simple admin authentication (in a real app, this would be more secure)
  const handleAuthenticate = () => {
    // Admin password is "bttf1985" (from Back to the Future)
    if (password === "bttf1985") {
      setAuthenticated(true);
      toast.success("Admin authenticated");
    } else {
      toast.error("Invalid password");
    }
  };

  // Redirect to home if accessed directly without authentication
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!authenticated) {
        // After 30 seconds of inactivity, redirect to home
        navigate("/");
      }
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [authenticated, navigate]);

  return (
    <Layout>
      <div className="container py-10">
        <div className="max-w-3xl mx-auto">
          {!authenticated ? (
            <Card className="p-6 border-red-400/30 bg-black/50">
              <h1 className="text-2xl font-bold mb-6 text-red-400">Admin Authentication Required</h1>
              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAuthenticate();
                  }}
                  autoFocus
                />
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Cancel
                  </Button>
                  <Button onClick={handleAuthenticate}>Authenticate</Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

              <Card className="p-6 border-blue-400/30">
                <h2 className="text-xl font-bold mb-4">Game Statistics</h2>
                <div className="space-y-2">
                  <p>Current Player: {state.player?.name || "None"}</p>
                  <p>Total Questions: {state.questions.length}</p>
                  <p>Active Session: {state.currentSession ? "Yes" : "No"}</p>
                </div>
              </Card>

              <Card className="p-6 border-amber-400/30">
                <h2 className="text-xl font-bold mb-4">Game Controls</h2>
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => {
                      navigate("/levels");
                      toast.info("Navigated to levels page");
                    }}
                  >
                    View Levels
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigate("/");
                      toast.info("Returned to home page");
                    }}
                  >
                    Return Home
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
