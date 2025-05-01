import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCostumes, getCostumeCategories, getGames, getParticipants } from "@/lib/firebase";
import { Costume, CostumeCategory, Game, Participant } from "@/types";
import { Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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

interface TriviaLeaderboardEntry {
  id: string;
  name: string;
  totalScore: number;
  gamesPlayed: number;
  averageScore: number;
  highestScore: number;
}

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("costumes");
  const [costumeLeaders, setCostumeLeaders] = useState<CostumeLeaderboardEntry[]>([]);
  const [triviaLeaders, setTriviaLeaders] = useState<TriviaLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

        // Fetch trivia data
        const games = await getGames();
        const activeGames = games.filter((game) => game.status === "ended");

        // Get participants from all ended games
        const participantPromises = activeGames.map((game) => getParticipants(game.id));
        const allParticipants = await Promise.all(participantPromises);

        // Process trivia data
        const playerScores = new Map<
          string,
          {
            name: string;
            scores: number[];
            gamesPlayed: number;
          }
        >();

        allParticipants.flat().forEach((participant) => {
          const existing = playerScores.get(participant.id) || {
            name: participant.name,
            scores: [],
            gamesPlayed: 0,
          };

          existing.scores.push(participant.score);
          existing.gamesPlayed++;
          playerScores.set(participant.id, existing);
        });

        const triviaEntries: TriviaLeaderboardEntry[] = Array.from(playerScores.entries()).map(([id, data]) => ({
          id,
          name: data.name,
          totalScore: data.scores.reduce((sum, score) => sum + score, 0),
          gamesPlayed: data.gamesPlayed,
          averageScore: data.scores.reduce((sum, score) => sum + score, 0) / data.gamesPlayed,
          highestScore: Math.max(...data.scores),
        }));

        // Sort by average score
        triviaEntries.sort((a, b) => b.averageScore - a.averageScore);
        setTriviaLeaders(triviaEntries);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
            {triviaLeaders.slice(0, 5).map((player, index) => (
              <div key={player.id} className="flex items-center gap-4 p-4 bg-secondary/5 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <span className="text-xl font-bold">{index + 1}</span>
                </div>
                <div>
                  <h3 className="font-semibold">{player.name}</h3>
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Average Score</p>
                      <p className="font-medium">{player.averageScore.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Games Played</p>
                      <p className="font-medium">{player.gamesPlayed}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Highest Score</p>
                      <p className="font-medium">{player.highestScore}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
