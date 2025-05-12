import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Plus, Search, MoreHorizontal, Edit, Trash2, Users, Play, StopCircle, Filter, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { WindowConfigCard } from "@/components/WindowConfigCard";

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
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const { userRole } = useAuth();

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

  const handleEndGame = async (gameId: string) => {
    try {
      await updateGame(gameId, { status: "inactive" });
      setGames(games.map((game) => (game.id === gameId ? { ...game, status: "inactive" } : game)));
      setFilteredGames(filteredGames.map((game) => (game.id === gameId ? { ...game, status: "inactive" } : game)));
      toast.success("Game ended successfully");
    } catch (error) {
      toast.error("Failed to end game");
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
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300";
    }
  };

  const getStatusBadgeVariant = (status: GameStatus) => {
    switch (status) {
      case "active":
        return "destructive";
      case "inactive":
        return "default";
      default:
        return "default";
    }
  };

  const handleStartGame = async (gameId: string) => {
    try {
      await updateGame(gameId, { status: "active" });
      setGames(games.map((game) => (game.id === gameId ? { ...game, status: "active" } : game)));
      setFilteredGames(filteredGames.map((game) => (game.id === gameId ? { ...game, status: "active" } : game)));
      toast.success("Game started successfully");
    } catch (error) {
      toast.error("Failed to start game");
    }
  };

  return (
    <AdminLayout title="Games Management" subtitle="Create and manage your trivia games" breadcrumbs={[{ label: "Games", href: "/admin/games" }]}>
      <WindowConfigCard type="trivia" title="Trivia Play Window" defaultMessage="Trivia will open at {time}" />
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#666]" />
            <Input placeholder="Search games..." className="pl-8 bg-[#222] border-[#333] text-white placeholder:text-[#666]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="border-[#333] text-[#666] hover:text-white hover:border-[#FF3D00]">
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            {userRole !== "admin" && (
              <Link to="/admin/games/new">
                <Button className="bg-gradient-to-r from-[#FFD700] to-[#FF3D00] text-white hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Game
                </Button>
              </Link>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-2 p-4 border rounded-md bg-[#111] border-[#333]">
            <div>
              <label className="text-sm font-medium mb-1 block text-white">Status</label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as GameStatus | "all")}>
                <SelectTrigger className="bg-[#222] border-[#333] text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-[#222] border-[#333]">
                  <SelectItem value="all" className="text-white hover:bg-[#333]">
                    All Status
                  </SelectItem>
                  <SelectItem value="active" className="text-white hover:bg-[#333]">
                    Active
                  </SelectItem>
                  <SelectItem value="inactive" className="text-white hover:bg-[#333]">
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-[#FF3D00] border-t-transparent rounded-full" />
        </div>
      ) : filteredGames.length > 0 ? (
        <div className="rounded-md border border-[#333] bg-[#111]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-[#222] border-b border-[#333]">
                <TableHead className="text-[#666]">Title</TableHead>
                <TableHead className="text-[#666]">Status</TableHead>
                <TableHead className="text-[#666]">Created</TableHead>
                <TableHead className="text-[#666]">Players</TableHead>
                <TableHead className="text-[#666]">Questions</TableHead>
                <TableHead className="text-[#666]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGames.map((game) => (
                <TableRow key={game.id} className="hover:bg-[#222] border-b border-[#333]">
                  <TableCell className="font-medium text-white">{game.title}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(game.status)} className={getStatusBadgeClass(game.status)}>
                      {game.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#666]">{game.createdAt ? format(game.createdAt.toDate(), "yyyy-MM-dd HH:mm") : "-"}</TableCell>
                  <TableCell className="text-[#666]">{game.participantCount ?? 0}</TableCell>
                  <TableCell className="text-[#666]">{game.questionIds?.length ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-center">
                      {userRole !== "admin" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-[#666] hover:text-white hover:bg-[#222]">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#222] border-[#333]">
                            <Link to={`/admin/games/${game.id}`}>
                              <DropdownMenuItem className="text-white hover:bg-[#333] cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                            </Link>
                            <Link to={`/admin/games/${game.id}/edit`}>
                              <DropdownMenuItem className="text-white hover:bg-[#333] cursor-pointer">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              className="text-white hover:bg-[#333] cursor-pointer"
                              onClick={async () => {
                                const newStatus = game.status === "active" ? "draft" : "active";
                                try {
                                  await updateGame(game.id, { status: newStatus });
                                  setGames(games.map((g) => (g.id === game.id ? { ...g, status: newStatus } : g)));
                                  setFilteredGames(filteredGames.map((g) => (g.id === game.id ? { ...g, status: newStatus } : g)));
                                  toast.success(`Game status set to ${newStatus}`);
                                } catch (error) {
                                  toast.error("Failed to update game status");
                                }
                              }}
                            >
                              {game.status === "active" ? "Set Draft" : "Set Active"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[#FF3D00] hover:bg-[#333] hover:text-[#FF3D00] cursor-pointer" onClick={() => setDeleteGameId(game.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-[#666] italic">View Only</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-12 border rounded-md bg-[#111] border-[#333]">
          <h3 className="text-lg font-medium mb-2 text-white">No games found</h3>
          <p className="text-[#666] mb-6">{searchTerm || statusFilter !== "all" ? "Try adjusting your filters" : "Create your first game to get started"}</p>
          {userRole !== "admin" && (
            <Link to="/admin/games/new">
              <Button className="bg-gradient-to-r from-[#FFD700] to-[#FF3D00] text-white hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Add Game
              </Button>
            </Link>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteGameId} onOpenChange={() => setDeleteGameId(null)}>
        <AlertDialogContent className="bg-[#111] border-[#333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#666]">This will permanently delete this game. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#222] text-white border-[#333] hover:bg-[#333] hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-gradient-to-r from-[#FFD700] to-[#FF3D00] text-white hover:opacity-90" onClick={handleDeleteGame}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminGames;
