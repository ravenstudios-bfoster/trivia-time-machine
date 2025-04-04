import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGames, getQuestions } from "@/lib/firebase";
import { Game, Question, GameStatus } from "@/types";
import { Gamepad2, HelpCircle, Clock, Users, Trophy, CalendarDays, ShieldAlert, Database, Plus } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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
  const completedGames = games.filter((game) => game.status === "completed").length;
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
      case "cancelled":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusBadgeVariant = (status: GameStatus) => {
    switch (status) {
      case "scheduled":
        return "default";
      case "active":
        return "destructive";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  if (error) {
    return (
      <AdminLayout title="Dashboard" subtitle="Overview of your trivia games and questions" breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }]}>
        <div className="flex flex-col items-center justify-center h-64">
          <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" subtitle="Overview of your trivia games and questions" breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }]}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#111] border-[#333]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Games</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-[#FF3D00]">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{games.length}</div>
            <p className="text-xs text-[#666]">+{scheduledGames} new this week</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#333]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Games</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-[#FF3D00]">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeGames}</div>
            <p className="text-xs text-[#666]">{Math.round((activeGames / games.length) * 100) || 0}% of total games</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#333]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Questions</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-[#FF3D00]">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{questions.length}</div>
            <p className="text-xs text-[#666]">+{level1Questions + level2Questions + level3Questions} new this week</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#333]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Average Score</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-[#FF3D00]">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{Math.round((activeGames / games.length) * 100) || 0}%</div>
            <p className="text-xs text-[#666]">+{Math.round((activeGames / games.length) * 100) - Math.round((activeGames / games.length) * 100) || 0}% from last week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-4 bg-[#111] border-[#333]">
          <CardHeader>
            <CardTitle className="text-white">Recent Games</CardTitle>
          </CardHeader>
          <CardContent>
            {recentGames.length > 0 ? (
              <div className="rounded-md border border-[#333] bg-[#111]">
                <div className="bg-[#222] p-3 grid grid-cols-12 text-xs font-medium text-[#666]">
                  <div className="col-span-4">Game</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Players</div>
                  <div className="col-span-2">Created</div>
                  <div className="col-span-2">Actions</div>
                </div>
                <div className="divide-y divide-[#333]">
                  {recentGames.map((game) => (
                    <div key={game.id} className="p-3 grid grid-cols-12 items-center text-sm">
                      <div className="col-span-4 font-medium text-white">{game.title}</div>
                      <div className="col-span-2">
                        <Badge variant={getStatusBadgeVariant(game.status)} className="bg-gradient-to-r from-[#FFD700] to-[#FF3D00] text-white">
                          {game.status}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-[#666]">{game.maxPlayers}</div>
                      <div className="col-span-2 text-[#666]">{format(game.createdAt.toDate(), "MMM d")}</div>
                      <div className="col-span-2">
                        <Link to={`/admin/games/${game.id}`}>
                          <Button variant="outline" size="sm" className="border-[#333] text-[#666] hover:text-white hover:border-[#FF3D00]">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[#666] mb-4">No recent games found</p>
                <Link to="/admin/games/new">
                  <Button className="bg-gradient-to-r from-[#FFD700] to-[#FF3D00] text-white hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Game
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-[#111] border-[#333]">
          <CardHeader>
            <CardTitle className="text-white">Recent Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentQuestions.length > 0 ? (
              <div className="rounded-md border border-[#333] bg-[#111]">
                <div className="bg-[#222] p-3 grid grid-cols-12 text-xs font-medium text-[#666]">
                  <div className="col-span-5">Question</div>
                  <div className="col-span-2">Level</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-3">Actions</div>
                </div>
                <div className="divide-y divide-[#333]">
                  {recentQuestions.map((question) => (
                    <div key={question.id} className="p-3 grid grid-cols-12 items-center text-sm">
                      <div className="col-span-5 font-medium truncate text-white" title={question.text}>
                        {question.text}
                      </div>
                      <div className="col-span-2 text-[#666]">Level {question.level}</div>
                      <div className="col-span-2 text-[#666]">{question.type}</div>
                      <div className="col-span-3">
                        <Link to={`/admin/questions/${question.id}`}>
                          <Button variant="outline" size="sm" className="border-[#333] text-[#666] hover:text-white hover:border-[#FF3D00]">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[#666] mb-4">No recent questions found</p>
                <Link to="/admin/questions/new">
                  <Button className="bg-gradient-to-r from-[#FFD700] to-[#FF3D00] text-white hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Question
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
