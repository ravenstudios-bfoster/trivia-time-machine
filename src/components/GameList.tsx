import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import { Game, Level } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getGamesForLevel, hasUserPlayedGame } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface GameListProps {
  level: Level;
  onClose: () => void;
}

export const GameList = ({ level, onClose }: GameListProps) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [playedGames, setPlayedGames] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadGames = async () => {
      try {
        // Get all active games for this level
        const levelGames = await getGamesForLevel(level.toString());
        setGames(levelGames);

        // Check which games the user has played
        if (currentUser) {
          const playedStatus = await Promise.all(
            levelGames.map(async (game) => {
              const hasPlayed = await hasUserPlayedGame(game.id, currentUser.id);
              return [game.id, hasPlayed];
            })
          );
          setPlayedGames(Object.fromEntries(playedStatus));
        }
      } catch (error) {
        console.error("Error loading games:", error);
        toast.error("Failed to load games");
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, [level, currentUser]);

  const handleJoinGame = (gameId: string) => {
    if (playedGames[gameId]) {
      toast.error("You have already played this game!");
      return;
    }
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
                <Button
                  onClick={() => handleJoinGame(game.id)}
                  className={`${playedGames[game.id] ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-600 hover:bg-yellow-700"}`}
                  disabled={playedGames[game.id]}
                >
                  {playedGames[game.id] ? "Already Played" : "Join Game"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
