import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getGames, deleteGame } from "@/lib/firebase";
import { Game, GameStatus } from "@/types";
import { toast } from "sonner";
import { Plus, Search, MoreVertical, Edit, Trash2, Play, Clock, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";

const GameList = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Load games
  useEffect(() => {
    const loadGames = async () => {
      try {
        setIsLoading(true);
        const gamesData = await getGames();
        setGames(gamesData);
      } catch (error) {
        console.error("Error loading games:", error);
        toast.error("Failed to load games");
      } finally {
        setIsLoading(false);
      }
    };

    loadGames();
  }, []);

  // Handle game deletion
  const handleDeleteGame = async (gameId: string) => {
    if (!confirm("Are you sure you want to delete this game? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteGame(gameId);
      setGames(games.filter((game) => game.id !== gameId));
      toast.success("Game deleted successfully");
    } catch (error) {
      console.error("Error deleting game:", error);
      toast.error("Failed to delete game");
    }
  };

  // Filter games based on search term
  const filteredGames = games.filter((game) => game.title.toLowerCase().includes(searchTerm.toLowerCase()) || (game.description && game.description.toLowerCase().includes(searchTerm.toLowerCase())));

  // Get status badge variant
  const getStatusBadge = (status: GameStatus) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline">Scheduled</Badge>;
      case "active":
        return <Badge variant="default">In Progress</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "ended":
        return <Badge variant="destructive">Ended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format timestamp to date
  const formatTimestamp = (timestamp: Timestamp | Date | undefined) => {
    if (!timestamp) return null;

    // If it's a Firebase Timestamp, convert to JS Date
    if (timestamp instanceof Timestamp) {
      return format(timestamp.toDate(), "MMM d, yyyy");
    }

    // If it's already a Date or can be parsed as one
    try {
      return format(new Date(timestamp), "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  return (
    <AdminLayout title="Games" subtitle="Manage your trivia games" breadcrumbs={[{ label: "Games", href: "/admin/games" }]}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search games..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <Button onClick={() => navigate("/admin/games/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Game
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Games</CardTitle>
            <CardDescription>
              {filteredGames.length} {filteredGames.length === 1 ? "game" : "games"} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredGames.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No games found</p>
                {searchTerm ? (
                  <p className="text-sm mt-2">Try adjusting your search term</p>
                ) : (
                  <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/games/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first game
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGames.map((game) => (
                      <TableRow key={game.id}>
                        <TableCell>
                          <div className="font-medium">{game.title}</div>
                          {game.description && <div className="text-sm text-muted-foreground truncate max-w-xs">{game.description}</div>}
                        </TableCell>
                        <TableCell>{getStatusBadge(game.status)}</TableCell>
                        <TableCell>
                          {game.createdAt ? (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span className="text-sm">{formatTimestamp(game.createdAt)}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>{game.participantCount || 0}</span>
                            <span className="text-muted-foreground ml-1">/ {game.maxParticipants}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span>{game.questionIds?.length || 0}</span>
                            <span className="text-muted-foreground ml-1">questions</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate(`/admin/games/${game.id}`)}>
                                <Play className="h-4 w-4 mr-2" />
                                View Game
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/admin/games/${game.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteGame(game.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default GameList;
