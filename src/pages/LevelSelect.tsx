import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/ui/Layout";
import GameButton from "@/components/ui/GameButton";
import { useGame } from "@/context/GameContext";
import { Level } from "@/types";
import { getLevelDescription } from "@/lib/gameLogic";
import { Card } from "@/components/ui/card";
import { Zap, LightbulbIcon, BrainCircuit, Trophy } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { GameList } from "@/components/GameList";
import { createGame } from "@/lib/firebase";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { format } from "date-fns";

const LevelSelect = () => {
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboards, setLeaderboards] = useState<Record<number, { displayName: string; totalScore: number }[]>>({});
  const [loadingLeaderboards, setLoadingLeaderboards] = useState(false);
  const [windowLoading, setWindowLoading] = useState(true);
  const [windowMessage, setWindowMessage] = useState<string | null>(null);

  const handleStartGame = async (level: Level) => {
    setIsLoading(true);
    try {
      // Create a new game for the selected level
      const game = await createGame({
        title: `Back to the Future Trivia - Level ${level}`,
        description: getLevelDescription(level),
        status: "active",
        timeLimit: 30, // 30 seconds per question
        scoringThreshold: 5,
        enableHints: true,
        enableBonusQuestions: true,
        enablePostGameReview: true,
        allowedLevels: [level.toString()],
        currentQuestionIndex: 0,
        participants: [],
        updatedAt: Timestamp.now(),
        adminId: auth.currentUser?.uid || "system",
        questionIds: [], // Will be populated when questions are added
      });

      if (!game) {
        toast.error("Failed to create a game. Please try again.");
        return;
      }

      // Start a new game session
      dispatch({
        type: "START_SESSION",
        payload: {
          selectedLevels: [level],
          gameId: game,
        },
      });

      // Navigate to game page
      navigate("/game");
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("An error occurred while starting the game. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const levels: Level[] = [1, 2, 3];

  useEffect(() => {
    const fetchLeaderboards = async () => {
      setLoadingLeaderboards(true);
      const newLeaderboards: Record<number, { displayName: string; totalScore: number }[]> = {};
      for (const level of levels) {
        const q = query(collection(db, "game-results"), where("level", "==", level), orderBy("totalScore", "desc"), limit(10));
        const snapshot = await getDocs(q);
        newLeaderboards[level] = snapshot.docs.map((doc) => ({
          displayName: doc.data().displayName || doc.data().participantId || "Player",
          totalScore: doc.data().totalScore || 0,
        }));
      }
      setLeaderboards(newLeaderboards);
      setLoadingLeaderboards(false);
    };
    fetchLeaderboards();
  }, []);

  useEffect(() => {
    // Fetch trivia play window config
    const fetchWindow = async () => {
      setWindowLoading(true);
      const docRef = doc(db, "config", "triviaWindow");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const now = new Date();
        const start = data.startDateTime?.toDate();
        const end = data.endDateTime?.toDate();
        let msg = data.message || "Trivia will open at {time}";
        if (start && msg.includes("{time}")) {
          msg = msg.replace("{time}", format(start, "PPPp"));
        }
        if (!start || !end) {
          setWindowMessage(msg); // fallback
        } else if (now < start) {
          setWindowMessage(msg); // trivia not open yet
        } else if (now > end) {
          setWindowMessage("This trivia game has ended.");
        } else {
          setWindowMessage(null); // trivia is open
        }
      } else {
        setWindowMessage(null);
      }
      setWindowLoading(false);
    };
    fetchWindow();
  }, []);

  if (windowLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-[#FF3D00] border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (windowMessage) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-xl text-gray-200 font-semibold">{windowMessage}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Select Your Level</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {levels.map((level) => (
            <Card key={level} className={`p-6 hover:shadow-lg transition-shadow cursor-pointer ${level === 3 ? "border-purple-500" : "border-yellow-500"}`} onClick={() => setSelectedLevel(level)}>
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Level Icons */}
                <div className="relative">
                  {level === 1 && <Zap className="w-12 h-12 text-yellow-500" />}
                  {level === 2 && <LightbulbIcon className="w-12 h-12 text-blue-500" />}
                  {level === 3 && <BrainCircuit className="w-12 h-12 text-purple-500" />}
                  {level !== 3 && <Trophy className="absolute -top-2 -right-2 w-6 h-6 text-yellow-500" />}
                </div>

                {/* Level Title */}
                <h2 className="text-2xl font-bold">Level {level}</h2>

                {/* Prize/Bragging Rights Badge */}
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${level === 3 ? "bg-purple-100 text-purple-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {level === 3 ? "Bragging Rights" : "Win Prizes!"}
                </div>

                {/* Level Description */}
                <p className="text-muted-foreground">{getLevelDescription(level)}</p>

                {/* Leaderboard Preview (for Level 1 & 2) */}
                <div className="w-full mt-4 p-3 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2 text-gray-900">Top Players</h3>
                  {loadingLeaderboards ? (
                    <div className="text-gray-500 text-sm">Loading...</div>
                  ) : leaderboards[level] && leaderboards[level].length > 0 ? (
                    <div className="space-y-1">
                      {leaderboards[level].map((player, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm text-gray-700">
                          <span>
                            {idx + 1}. {player.displayName}
                          </span>
                          <span className="font-bold text-gray-900">{player.totalScore} pts</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">No players yet.</div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Game List Dialog */}
      <Dialog open={selectedLevel !== null} onOpenChange={() => setSelectedLevel(null)}>
        <DialogContent className="sm:max-w-[600px]">{selectedLevel && <GameList level={selectedLevel} onClose={() => setSelectedLevel(null)} />}</DialogContent>
      </Dialog>
    </Layout>
  );
};

export default LevelSelect;
