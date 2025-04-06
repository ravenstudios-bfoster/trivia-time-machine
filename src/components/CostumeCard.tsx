import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { castVote, type CostumeCategory } from "@/lib/firebase";
import { Costume, Vote } from "@/types";
import { toast } from "sonner";
import CostumeEditForm from "./CostumeEditForm";

interface CostumeCardProps {
  costume: Costume;
  userVotes: Vote[];
  categories: CostumeCategory[];
  onVote: () => void;
}

const CostumeCard = ({ costume, userVotes, categories, onVote }: CostumeCardProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [isEditing, setIsEditing] = useState(false);

  const hasVotedFor = (categoryTag: string) => {
    return userVotes.some((vote) => vote.category === categoryTag && vote.costumeId === costume.id);
  };

  const handleVote = async (categoryTag: string) => {
    if (!currentUser) {
      toast.error("Please sign in to vote");
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

  // Get the categories this costume belongs to
  const costumeCategories = categories.filter(
    (category) =>
      // Check if the costume's category matches this category's tag
      // or if the costume has votes in this category (for legacy data)
      costume.category === category.tag ||
      costume.category?.includes(category.tag) || // In case category is an array
      (costume.votes && category.tag in costume.votes)
  );

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
                <Button variant="outline" size="sm" disabled={!currentUser || hasVotedFor(category.tag) || isLoading[category.tag]} onClick={() => handleVote(category.tag)}>
                  {isLoading[category.tag] ? "Voting..." : hasVotedFor(category.tag) ? "Voted" : "Vote"}
                </Button>
              </div>
            ))}
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
