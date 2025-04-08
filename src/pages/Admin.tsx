import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/ui/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGame } from "@/context/GameContext";
import { toast } from "sonner";

const Admin = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin, isLoading } = useAuth();
  const { state } = useGame();

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!currentUser || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [currentUser, isAdmin, isLoading, navigate]);

  if (isLoading || !currentUser || !isAdmin) {
    return null; // Or a loading spinner
  }

  return (
    <Layout>
      <div className="container py-10">
        <div className="max-w-3xl mx-auto">
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
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
