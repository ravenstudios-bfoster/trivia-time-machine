import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCostumes, getCostumeCategories, getGames, getParticipants } from "@/lib/firebase";
import { Costume, CostumeCategory, Game, Participant, Question } from "@/types";
import { Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { collection, getDocs, doc, getDoc, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CostumeLeaderboardEntry {
  id: string;
  characterName: string;
  submitterName: string;
  photoUrl: string;
  categoryWins: {
    categoryName: string;
    votes: number;
  }[];
  totalVotes: number;
}

interface TriviaLeader {
  participantId: string;
  displayName: string;
  totalScore: number;
  gamesPlayed: number;
  allResults: GameResult[];
}

interface PlayerDetail {
  gameId: string;
  questionId: string;
  answeredCorrectly: boolean;
  timeTaken: number;
  score: number;
  questionText: string;
}

interface GameResult {
  gameId: string;
  participantId: string;
  displayName: string;
  questions: PlayerDetail[];
  totalScore: number;
  // Add other fields as needed
}

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("costumes");
  const [costumeLeaders, setCostumeLeaders] = useState<CostumeLeaderboardEntry[]>([]);
  const [triviaLeaders, setTriviaLeaders] = useState<TriviaLeader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<TriviaLeader | null>(null);
  const [playerDetails, setPlayerDetails] = useState<PlayerDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch costume data
        const [costumes, categories] = await Promise.all([getCostumes(), getCostumeCategories()]);

        // Process costume data
        const costumeEntries = costumes.map((costume) => {
          const categoryWins = categories.map((category) => ({
            categoryName: category.name,
            votes: costume.votes[category.tag] || 0,
          }));

          return {
            id: costume.id,
            characterName: costume.characterName,
            submitterName: costume.submitterName,
            photoUrl: costume.photoUrl,
            categoryWins,
            totalVotes: Object.values(costume.votes).reduce((sum, votes) => sum + votes, 0),
          };
        });

        // Sort by total votes
        costumeEntries.sort((a, b) => b.totalVotes - a.totalVotes);
        setCostumeLeaders(costumeEntries);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch and aggregate game-results for trivia leaderboard
  useEffect(() => {
    const fetchTriviaLeaders = async () => {
      setIsLoading(true);
      const snapshot = await getDocs(collection(db, "game-results"));
      const results: GameResult[] = snapshot.docs.map((doc) => doc.data() as GameResult);
      // Aggregate by participantId
      const playerMap: Record<string, TriviaLeader> = {};
      for (const result of results) {
        if (!playerMap[result.participantId]) {
          playerMap[result.participantId] = {
            participantId: result.participantId,
            displayName: result.displayName || result.participantId,
            totalScore: 0,
            gamesPlayed: 0,
            allResults: [],
          };
        }
        playerMap[result.participantId].totalScore += result.totalScore || 0;
        playerMap[result.participantId].gamesPlayed += 1;
        playerMap[result.participantId].allResults.push(result);
      }
      const leaderboard = Object.values(playerMap).sort((a, b) => b.totalScore - a.totalScore);
      setTriviaLeaders(leaderboard);
      setIsLoading(false);
    };
    fetchTriviaLeaders();
  }, []);

  // Fetch per-question details for a player
  const handleViewDetails = async (player: TriviaLeader) => {
    setSelectedPlayer(player);
    setDetailsLoading(true);
    // Flatten all questions from all games
    const allQuestions: PlayerDetail[] = player.allResults.flatMap((res: GameResult) => (res.questions || []).map((q: PlayerDetail) => ({ ...q, gameId: res.gameId })));
    // Fetch question text for each unique questionId
    const uniqueQuestionIds = Array.from(new Set(allQuestions.map((q) => q.questionId)));
    const questionTextMap: Record<string, string> = {};
    for (const qid of uniqueQuestionIds) {
      if (typeof qid === "string") {
        const qDoc = await getDoc(doc(db, "questions", qid));
        questionTextMap[qid] = qDoc.exists() ? (qDoc.data() as Question)?.text || "" : "";
      }
    }
    // Attach question text to each answer
    const details: PlayerDetail[] = allQuestions.map((q) => ({
      ...q,
      questionText: questionTextMap[q.questionId] || q.questionId,
    }));
    setPlayerDetails(details);
    setDetailsLoading(false);
  };

  const handleCloseDetails = () => {
    setSelectedPlayer(null);
    setPlayerDetails([]);
  };

  const renderCostumeLeaderboard = () => (
    <div className="grid gap-6">
      {/* Overall Leaders */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Leaders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {costumeLeaders.slice(0, 3).map((costume, index) => (
              <div key={costume.id} className="flex flex-col sm:flex-row items-start gap-4 p-4 bg-secondary/5 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 flex-shrink-0">
                  <Medal className={`w-6 h-6 ${index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-amber-600"}`} />
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="w-full sm:w-48 h-48 relative rounded-lg overflow-hidden bg-black/20">
                      <img src={costume.photoUrl} alt={costume.characterName} className="w-full h-full object-contain" />
                    </div>
                    <div className="w-full sm:w-auto">
                      <h3 className="font-semibold text-lg">{costume.characterName}</h3>
                      <p className="text-sm text-muted-foreground">by {costume.submitterName}</p>
                      <p className="text-sm font-medium mt-1">{costume.totalVotes} total votes</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Winners */}
      <Card>
        <CardHeader>
          <CardTitle>Category Leaders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {costumeLeaders[0]?.categoryWins.map((category) => {
              const categoryLeader = costumeLeaders.reduce((leader, costume) => {
                const categoryVotes = costume.categoryWins.find((win) => win.categoryName === category.categoryName)?.votes || 0;
                return categoryVotes > (leader?.votes || 0) ? { costume, votes: categoryVotes } : leader;
              }, null as { costume: CostumeLeaderboardEntry; votes: number } | null);

              if (!categoryLeader) return null;

              return (
                <Card key={category.categoryName} className="border-none shadow-none bg-secondary/5">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">{category.categoryName}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <div className="w-full sm:w-32 h-32 relative rounded-lg overflow-hidden bg-black/20">
                        <img src={categoryLeader.costume.photoUrl} alt={categoryLeader.costume.characterName} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <h4 className="font-medium text-base">{categoryLeader.costume.characterName}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{categoryLeader.votes} votes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTriviaLeaderboard = () => (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {isLoading ? (
              <div>Loading...</div>
            ) : triviaLeaders.length === 0 ? (
              <div>No trivia results yet.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">#</th>
                    <th className="text-left">Player</th>
                    <th className="text-left">Total Points</th>
                    <th className="text-left">Games Played</th>
                    <th className="text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {triviaLeaders.map((player, idx) => (
                    <tr key={player.participantId} className="border-b border-gray-200">
                      <td>{idx + 1}</td>
                      <td>{player.displayName}</td>
                      <td>{player.totalScore}</td>
                      <td>{player.gamesPlayed}</td>
                      <td>
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(player)}>
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Player Details Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full relative text-gray-900">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-black" onClick={handleCloseDetails}>
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-900">{selectedPlayer.displayName}'s Answers</h2>
            {detailsLoading ? (
              <div>Loading...</div>
            ) : playerDetails.length === 0 ? (
              <div>No answers found.</div>
            ) : (
              <table className="min-w-full text-xs text-gray-900">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left">Game</th>
                    <th className="text-left">Question</th>
                    <th className="text-left">Correct?</th>
                    <th className="text-left">Points</th>
                    <th className="text-left">Time (s)</th>
                  </tr>
                </thead>
                <tbody>
                  {playerDetails.map((q, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="text-gray-900">{q.gameId}</td>
                      <td className="text-gray-900">{q.questionText}</td>
                      <td className="text-gray-900">{q.answeredCorrectly ? "✅" : "❌"}</td>
                      <td className="text-gray-900">{q.score}</td>
                      <td className="text-gray-900">{q.timeTaken}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout title="Leaderboard" subtitle="View top performers in costume contests and trivia games." breadcrumbs={[{ label: "Leaderboard", href: "/admin/leaderboard" }]}>
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="costumes">Costume Contest</TabsTrigger>
            <TabsTrigger value="trivia">Trivia Games</TabsTrigger>
          </TabsList>

          <TabsContent value="costumes" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              renderCostumeLeaderboard()
            )}
          </TabsContent>

          <TabsContent value="trivia" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              renderTriviaLeaderboard()
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Leaderboard;
