import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { castVote, getVotingWindow } from "@/lib/firebase";
import { Costume, Vote, CostumeCategory, VotingWindow } from "@/types";
import { toast } from "sonner";
import CostumeEditForm from "./CostumeEditForm";
import { format } from "date-fns";

interface CostumeCardProps {
  costume: Costume;
  userVotes: Vote[];
  categories: CostumeCategory[];
  onVote: () => void;
  isVotingEnabled: boolean;
}

const CostumeCard = ({ costume, userVotes, categories, onVote, isVotingEnabled }: CostumeCardProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [votingWindow, setVotingWindow] = useState<VotingWindow | null>(null);
  const [isVotingOpen, setIsVotingOpen] = useState(false);

  useEffect(() => {
    const fetchVotingWindow = async () => {
      try {
        const window = await getVotingWindow();
        setVotingWindow(window);
      } catch (error) {
        console.error("Error fetching voting window:", error);
      }
    };

    fetchVotingWindow();
  }, []);

  useEffect(() => {
    if (!votingWindow) return;

    const checkVotingWindow = () => {
      const now = new Date();

      if (votingWindow.startDateTime && votingWindow.endDateTime) {
        // New format with full date-time
        const startTime = votingWindow.startDateTime.toDate();
        const endTime = votingWindow.endDateTime.toDate();
        setIsVotingOpen(now >= startTime && now <= endTime);
      } else if (votingWindow.startTime && votingWindow.endTime) {
        // Old format with just times
        const [startHour, startMinute] = votingWindow.startTime.split(":").map(Number);
        const [endHour, endMinute] = votingWindow.endTime.split(":").map(Number);

        const startTime = new Date();
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date();
        endTime.setHours(endHour, endMinute, 0, 0);

        setIsVotingOpen(now >= startTime && now <= endTime);
      }
    };

    checkVotingWindow();
    const interval = setInterval(checkVotingWindow, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [votingWindow]);

  const hasVotedFor = (categoryTag: string) => {
    return userVotes.some((vote) => vote.category === categoryTag && vote.costumeId === costume.id);
  };

  const handleVote = async (categoryTag: string) => {
    if (!currentUser) {
      toast.error("Please sign in to vote");
      return;
    }

    if (!isVotingEnabled) {
      toast.error("Voting is not currently open");
      return;
    }

    if (!categoryTag) {
      toast.error("Invalid category");
      return;
    }

    try {
      setIsLoading((prev) => ({ ...prev, [categoryTag]: true }));
      await castVote(currentUser.uid, costume.id, categoryTag);
      toast.success("Vote cast successfully!");
      onVote();
    } catch (error) {
      console.error("Error casting vote:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to cast vote");
      }
    } finally {
      setIsLoading((prev) => ({ ...prev, [categoryTag]: false }));
    }
  };

  const isSubmitter = currentUser?.uid === costume.submittedBy;

  // Filter the main category list to only those this costume belongs to
  const costumeCategories = categories.filter((category) => costume.categories?.includes(category.tag));

  return (
    <>
      <Card className="w-full overflow-hidden">
        <CardHeader className="p-0">
          <div className="relative aspect-square">
            <img
              src={costume.photoUrl}
              alt={costume.characterName}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder-costume.jpg";
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-1">{costume.characterName}</h3>
          <p className="text-sm text-muted-foreground">Submitted by {costume.submitterName}</p>

          <div className="mt-4 space-y-2">
            {costumeCategories.map((category) => (
              <div key={category.id} className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium">{category.name}</span>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                  <span className="text-sm text-muted-foreground">Votes: {costume.votes[category.tag] || 0}</span>
                </div>
                <Button variant="outline" size="sm" disabled={!currentUser || hasVotedFor(category.tag) || isLoading[category.tag] || !isVotingOpen} onClick={() => handleVote(category.tag)}>
                  {isLoading[category.tag] ? "Voting..." : hasVotedFor(category.tag) ? "Voted" : "Vote"}
                </Button>
              </div>
            ))}
            {costumeCategories.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">This costume hasn't been assigned to any categories yet.</p>}
          </div>

          {isSubmitter && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit Costume
            </Button>
          )}
        </CardContent>
      </Card>

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <CostumeEditForm
            costume={costume}
            onClose={() => setIsEditing(false)}
            onUpdate={() => {
              onVote();
              setIsEditing(false);
            }}
          />
        </div>
      )}
    </>
  );
};

export default CostumeCard;
