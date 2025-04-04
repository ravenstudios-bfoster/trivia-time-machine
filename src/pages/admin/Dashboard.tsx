import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGames, getQuestions } from "@/lib/firebase";
import { Game, Question, GameStatus } from "@/types";
import { Gamepad2, HelpCircle, Clock, Users, Trophy, CalendarDays, ShieldAlert, Database } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { isSuperAdmin } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch games and questions in parallel
        const [gamesData, questionsData] = await Promise.all([getGames(), getQuestions()]);

        setGames(gamesData);
        setQuestions(questionsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please try again later.");
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate stats
  const activeGames = games.filter((game) => game.status === "active").length;
  const completedGames = games.filter((game) => game.status === "completed" || game.status === "ended").length;
  const scheduledGames = games.filter((game) => game.status === "scheduled").length;

  const level1Questions = questions.filter((q) => q.level === 1).length;
  const level2Questions = questions.filter((q) => q.level === 2).length;
  const level3Questions = questions.filter((q) => q.level === 3).length;

  // Get recent games (last 5)
  const recentGames = [...games].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).slice(0, 5);

  // Get recent questions (last 5)
  const recentQuestions = [...questions]
    .sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    })
    .slice(0, 5);

  const getStatusColor = (status: GameStatus) => {
    switch (status) {
      case "scheduled":
        return "text-blue-500";
      case "active":
        return "text-green-500";
      case "completed":
        return "text-gray-500";
      case "ended":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  if (error) {
    return (
      <AdminLayout title="Dashboard" subtitle="Overview of your Back to the Future Trivia games">
        <div className="flex flex-col items-center justify-center h-64">
          <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" subtitle="Overview of your Back to the Future Trivia games">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Games</CardTitle>
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{games.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeGames} active, {scheduledGames} scheduled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{questions.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  L1: {level1Questions}, L2: {level2Questions}, L3: {level3Questions}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed Games</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedGames}</div>
                <p className="text-xs text-muted-foreground mt-1">{Math.round((completedGames / games.length) * 100) || 0}% completion rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Games</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeGames}</div>
                <p className="text-xs text-muted-foreground mt-1">{scheduledGames} games scheduled</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Tabs defaultValue="games">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <TabsList>
                <TabsTrigger value="games">Games</TabsTrigger>
                <TabsTrigger value="questions">Questions</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="games" className="space-y-4">
              {recentGames.length > 0 ? (
                <div className="rounded-md border">
                  <div className="bg-muted/50 p-3 grid grid-cols-12 text-xs font-medium">
                    <div className="col-span-4">Name</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-3">Created</div>
                    <div className="col-span-3">Actions</div>
                  </div>
                  <div className="divide-y">
                    {recentGames.map((game) => (
                      <div key={game.id} className="p-3 grid grid-cols-12 items-center text-sm">
                        <div className="col-span-4 font-medium">{game.title}</div>
                        <div className="col-span-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(game.status)}`}>{game.status}</span>
                        </div>
                        <div className="col-span-3 text-muted-foreground">{game.createdAt ? format(game.createdAt.toDate(), "MMM d, yyyy") : "N/A"}</div>
                        <div className="col-span-3">
                          <Link to={`/admin/games/${game.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 border rounded-md">
                  <p className="text-muted-foreground">No games created yet</p>
                  <Link to="/admin/games">
                    <Button className="mt-4">Create Your First Game</Button>
                  </Link>
                </div>
              )}

              <div className="flex justify-end">
                <Link to="/admin/games">
                  <Button variant="outline">View All Games</Button>
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="questions" className="space-y-4">
              {recentQuestions.length > 0 ? (
                <div className="rounded-md border">
                  <div className="bg-muted/50 p-3 grid grid-cols-12 text-xs font-medium">
                    <div className="col-span-5">Question</div>
                    <div className="col-span-2">Level</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-3">Actions</div>
                  </div>
                  <div className="divide-y">
                    {recentQuestions.map((question) => (
                      <div key={question.id} className="p-3 grid grid-cols-12 items-center text-sm">
                        <div className="col-span-5 font-medium truncate" title={question.text}>
                          {question.text}
                        </div>
                        <div className="col-span-2">Level {question.level}</div>
                        <div className="col-span-2 text-muted-foreground">{question.type}</div>
                        <div className="col-span-3">
                          <Link to={`/admin/questions/${question.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 border rounded-md">
                  <p className="text-muted-foreground">No questions created yet</p>
                  <Link to="/admin/questions">
                    <Button className="mt-4">Create Your First Question</Button>
                  </Link>
                </div>
              )}

              <div className="flex justify-end">
                <Link to="/admin/questions">
                  <Button variant="outline">View All Questions</Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/admin/games/new">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Gamepad2 className="h-5 w-5 mr-2" />
                      Create New Game
                    </CardTitle>
                    <CardDescription>Set up a new trivia game with custom settings</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/admin/questions/new">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <HelpCircle className="h-5 w-5 mr-2" />
                      Create New Question
                    </CardTitle>
                    <CardDescription>Add a new question to your question bank</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              {isSuperAdmin && (
                <Link to="/admin/users">
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        Manage Users
                      </CardTitle>
                      <CardDescription>View and manage admin users</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
