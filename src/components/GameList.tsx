import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import { Game, Level } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getGames } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface GameListProps {
  level: Level;
  onClose: () => void;
}

export const GameList = ({ level, onClose }: GameListProps) => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGames = async () => {
      try {
        // Get all active games for this level
        const allGames = await getGames();
        const levelGames = allGames.filter((game) => game.status === "active" && game.allowedLevels.includes(level.toString()));
        setGames(levelGames);
      } catch (error) {
        console.error("Error loading games:", error);
        toast.error("Failed to load games");
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, [level]);

  const handleJoinGame = (gameId: string) => {
    // Simply navigate to the game page
    navigate(`/game/${gameId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Level {level} Games</h2>
      </div>

      {games.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No active games available at this time. Please check back later!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {games.map((game) => (
            <Card key={game.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{game.title}</h3>
                  <p className="text-sm text-gray-500">Players: {game.participantCount || 0}</p>
                </div>
                <Button onClick={() => handleJoinGame(game.id)} className="bg-yellow-600 hover:bg-yellow-700">
                  Join Game
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
