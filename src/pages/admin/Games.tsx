import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { getGames, deleteGame, updateGame } from "@/lib/firebase";
import { Game, GameStatus } from "@/types";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Users, Play, StopCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";

const AdminGames = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<GameStatus | "all">("all");
  const [deleteGameId, setDeleteGameId] = useState<string | null>(null);
  const [endGameId, setEndGameId] = useState<string | null>(null);
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoading(true);
        const gamesData = await getGames();
        setGames(gamesData as Game[]);
        setFilteredGames(gamesData as Game[]);
      } catch (error) {
        console.error("Error fetching games:", error);
        toast.error("Failed to load games");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, []);

  useEffect(() => {
    let result = [...games];

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((game) => game.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((game) => game.title.toLowerCase().includes(term));
    }

    // Sort by creation date (newest first)
    result.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    });

    setFilteredGames(result);
  }, [games, searchTerm, statusFilter]);

  const handleDeleteGame = async () => {
    if (!deleteGameId) return;

    try {
      await deleteGame(deleteGameId);
      setGames(games.filter((game) => game.id !== deleteGameId));
      toast.success("Game deleted successfully");
    } catch (error) {
      console.error("Error deleting game:", error);
      toast.error("Failed to delete game");
    } finally {
      setDeleteGameId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedGames.size === 0) return;

    try {
      setIsLoading(true);
      const deletePromises = Array.from(selectedGames).map((gameId) => deleteGame(gameId));
      await Promise.all(deletePromises);

      setGames(games.filter((game) => !selectedGames.has(game.id)));
      setSelectedGames(new Set());
      toast.success(`${selectedGames.size} games deleted successfully`);
    } catch (error) {
      console.error("Error deleting games:", error);
      toast.error("Failed to delete some games");
    } finally {
      setIsLoading(false);
      setShowBulkDeleteDialog(false);
    }
  };

  const handleEndGame = async () => {
    if (!endGameId) return;

    try {
      const gameToEnd = games.find((game) => game.id === endGameId);
      if (!gameToEnd) return;

      await updateGame(endGameId, {
        status: "ended",
        endedAt: Timestamp.fromDate(new Date()),
      });

      // Update local state
      setGames(games.map((game) => (game.id === endGameId ? { ...game, status: "ended" as GameStatus } : game)));

      toast.success("Game ended successfully");
    } catch (error) {
      console.error("Error ending game:", error);
      toast.error("Failed to end game");
    } finally {
      setEndGameId(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedGames.size === filteredGames.length) {
      setSelectedGames(new Set());
    } else {
      setSelectedGames(new Set(filteredGames.map((game) => game.id)));
    }
  };

  const toggleGameSelection = (gameId: string) => {
    const newSelected = new Set(selectedGames);
    if (newSelected.has(gameId)) {
      newSelected.delete(gameId);
    } else {
      newSelected.add(gameId);
    }
    setSelectedGames(newSelected);
  };

  const getStatusBadgeClass = (status: GameStatus) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300";
      case "ended":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300";
    }
  };

  return (
    <AdminLayout title="Games Management" subtitle="Create and manage your trivia games" breadcrumbs={[{ label: "Games", href: "/admin/games" }]}>
      {/* Filters and Actions */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search games..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as GameStatus | "all")}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="ended">Ended by Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            {selectedGames.size > 0 && (
              <Button variant="destructive" onClick={() => setShowBulkDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedGames.size})
              </Button>
            )}
            <Link to="/admin/games/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Game
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Games Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredGames.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={selectedGames.size === filteredGames.length} onCheckedChange={toggleSelectAll} aria-label="Select all games" />
                </TableHead>
                <TableHead>Game Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Scheduled Time</TableHead>
                <TableHead>Levels</TableHead>
                <TableHead>Players</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGames.map((game) => (
                <TableRow key={game.id}>
                  <TableCell>
                    <Checkbox checked={selectedGames.has(game.id)} onCheckedChange={() => toggleGameSelection(game.id)} aria-label={`Select ${game.title}`} />
                  </TableCell>
                  <TableCell className="font-medium">{game.title}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(game.status)}`}>{game.status}</span>
                  </TableCell>
                  <TableCell>{game.createdAt ? format(game.createdAt.toDate(), "MMM d, yyyy") : "N/A"}</TableCell>
                  <TableCell>
                    {game.scheduledStartTime ? (
                      <div className="text-sm">
                        <div>Start: {format(game.scheduledStartTime.toDate(), "MMM d, h:mm a")}</div>
                        {game.expirationTime && <div className="text-muted-foreground">End: {format(game.expirationTime.toDate(), "MMM d, h:mm a")}</div>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Manual scheduling</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {game.allowedLevels
                      ? game.allowedLevels
                          .sort()
                          .map((level) => `L${level}`)
                          .join(", ")
                      : "None"}
                  </TableCell>
                  <TableCell>{game.participantCount || 0}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link to={`/admin/games/${game.id}`}>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            View/Edit
                          </DropdownMenuItem>
                        </Link>

                        <Link to={`/admin/games/${game.id}/players`}>
                          <DropdownMenuItem>
                            <Users className="h-4 w-4 mr-2" />
                            Manage Players
                          </DropdownMenuItem>
                        </Link>

                        {game.status === "scheduled" && !game.scheduledStartTime && (
                          <DropdownMenuItem
                            onClick={() => {
                              // Logic to start game
                              toast.info("Game start functionality to be implemented");
                            }}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Game
                          </DropdownMenuItem>
                        )}

                        {game.status === "active" && !game.expirationTime && (
                          <DropdownMenuItem onClick={() => setEndGameId(game.id)}>
                            <StopCircle className="h-4 w-4 mr-2" />
                            End Game
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteGameId(game.id)}>
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
      ) : (
        <div className="text-center p-12 border rounded-md">
          <h3 className="text-lg font-medium mb-2">No games found</h3>
          <p className="text-muted-foreground mb-6">{searchTerm || statusFilter !== "all" ? "Try adjusting your filters" : "Create your first game to get started"}</p>
          <Link to="/admin/games/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Game
            </Button>
          </Link>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteGameId} onOpenChange={() => setDeleteGameId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this game and all associated player data. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteGame}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Games</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedGames.size} games? This will permanently delete these games and all associated player data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleBulkDelete}>
              Delete {selectedGames.size} Games
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End Game Confirmation Dialog */}
      <AlertDialog open={!!endGameId} onOpenChange={() => setEndGameId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this game?</AlertDialogTitle>
            <AlertDialogDescription>This will end the game for all players and finalize scores. Players will no longer be able to join or continue playing.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndGame}>End Game</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminGames;
