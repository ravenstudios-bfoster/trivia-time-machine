import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCostumes, getUserVotes, getCostumeCategories, getVotingWindow, getCostumeInstructions, castVote, removeVote } from "@/lib/firebase";
import { Costume, Vote, CostumeCategory, VotingWindow, CostumeInstructions } from "@/types";
import CostumeCard from "@/components/CostumeCard";
import UserCostumeSubmission from "@/components/UserCostumeSubmission";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Layout } from "@/components/ui/Layout";
import { toast } from "sonner";
import { format } from "date-fns";
import { Clock, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";

// Add this type for the change vote dialog
interface ChangeVoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoryName: string;
}

// Add the ChangeVoteDialog component
function ChangeVoteDialog({ isOpen, onClose, onConfirm, categoryName }: ChangeVoteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>Change Your Vote?</DialogTitle>
        <DialogDescription>You have already selected another costume in this category, do you want to change your vote to this costume instead?</DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Change Vote</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CostumeVoting() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [categories, setCategories] = useState<CostumeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCostume, setSelectedCostume] = useState<Costume | null>(null);
  const [votingWindow, setVotingWindow] = useState<VotingWindow | null>(null);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [instructions, setInstructions] = useState<CostumeInstructions | null>(null);
  const [showSubmitButton, setShowSubmitButton] = useState(false);

  // Add state for change vote dialog
  const [changeVoteDialog, setChangeVoteDialog] = useState<{
    isOpen: boolean;
    costumeId: string;
    category: string;
    categoryName: string;
  }>({
    isOpen: false,
    costumeId: "",
    category: "",
    categoryName: "",
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fetchedCostumes, fetchedVotes, fetchedCategories, votingWindowData, instructionsData] = await Promise.all([
        getCostumes(),
        currentUser ? getUserVotes(currentUser.id) : Promise.resolve([]),
        getCostumeCategories(),
        getVotingWindow(),
        getCostumeInstructions(),
      ]);
      setCostumes(fetchedCostumes);
      setUserVotes(fetchedVotes);
      setCategories(fetchedCategories);
      setVotingWindow(votingWindowData);
      setInstructions(instructionsData);

      if (votingWindowData) {
        const now = new Date();
        const startTime = votingWindowData.startDateTime ? new Date(votingWindowData.startDateTime) : null;
        const endTime = votingWindowData.endDateTime ? new Date(votingWindowData.endDateTime) : null;

        if (startTime && endTime) {
          setIsVotingOpen(now >= startTime && now <= endTime);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load costumes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data once auth state is initialized
    if (!isAuthLoading) {
      fetchData();
    }
  }, [currentUser, isAuthLoading]);

  // Determine if the submit button should be shown
  useEffect(() => {
    if (!votingWindow?.startDateTime) {
      setShowSubmitButton(false);
      return;
    }
    const now = new Date();
    const startTime = new Date(votingWindow.startDateTime);
    const oneHourBefore = new Date(startTime.getTime() - 60 * 60 * 1000);
    setShowSubmitButton(now >= oneHourBefore);
  }, [votingWindow]);

  const handleVote = async (costumeId: string, category: string) => {
    console.log("Vote attempt:", {
      isVotingOpen,
      currentUser: currentUser?.id,
      costumeId,
      category,
    });

    if (!isVotingOpen) {
      toast.error(getVotingMessage());
      return;
    }

    if (!currentUser) {
      toast.error("Please sign in to vote");
      return;
    }

    // Check if this is the user's own submission
    const costume = costumes.find((c) => c.id === costumeId);
    if (costume && costume.submittedBy === currentUser.id) {
      toast.error("You cannot vote on your own submission");
      return;
    }

    // Check if user has already voted in this category
    const existingVote = userVotes.find((vote) => vote.category === category);
    if (existingVote) {
      // If they've voted for a different costume in this category
      if (existingVote.costumeId !== costumeId) {
        handleVoteChange(costumeId, category, categories.find((c) => c.tag === category)?.name || category);
      }
      return;
    }

    try {
      await castVote(currentUser.id, costumeId, category);
      const updatedVotes = await getUserVotes(currentUser.id);
      setUserVotes(updatedVotes);
      toast.success("Vote recorded successfully!");
    } catch (error) {
      console.error("Voting error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to cast vote");
    }
  };

  const getVotingMessage = () => {
    if (!votingWindow) return "Voting window not configured";
    let message = votingWindow.message || "Voting will start at {time}";

    if (votingWindow.startDateTime) {
      const startTime = new Date(votingWindow.startDateTime);
      const formattedTime = format(startTime, "MMMM do, yyyy 'at' h:mm a 'CST'");
      message = message.replace("{time}", formattedTime);
    }

    return message;
  };

  const getVotingStatus = () => {
    if (!votingWindow?.startDateTime) return null;
    const now = new Date();
    const startTime = new Date(votingWindow.startDateTime);
    const endTime = votingWindow.endDateTime ? new Date(votingWindow.endDateTime) : null;

    if (now < startTime) {
      return {
        label: "Not Started",
        variant: "secondary" as const,
      };
    } else if (endTime && now > endTime) {
      return {
        label: "Ended",
        variant: "destructive" as const,
      };
    } else {
      return {
        label: "Open",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-100/80 dark:hover:bg-green-900/80",
      };
    }
  };

  const handleSubmitSuccess = () => {
    setIsSubmitDialogOpen(false);
    fetchData();
  };

  const handleVoteChange = async (costumeId: string, category: string, categoryName: string) => {
    // Find the existing vote in this category (might be for a different costume)
    const existingVote = userVotes.find((vote) => vote.category === category);
    if (!existingVote) return; // This shouldn't happen given our button logic

    setChangeVoteDialog({
      isOpen: true,
      costumeId,
      category,
      categoryName,
    });
  };

  const handleVoteChangeConfirm = async () => {
    if (!currentUser || !changeVoteDialog.costumeId || !changeVoteDialog.category) return;

    try {
      // Find the existing vote in this category
      const existingVote = userVotes.find((vote) => vote.category === changeVoteDialog.category);
      if (existingVote) {
        // Remove the old vote
        await removeVote(currentUser.id, existingVote.costumeId, changeVoteDialog.category);
      }
      // Cast the new vote
      await castVote(currentUser.id, changeVoteDialog.costumeId, changeVoteDialog.category);

      // Refresh votes and costumes
      const [updatedVotes, updatedCostumes] = await Promise.all([getUserVotes(currentUser.id), getCostumes()]);
      setUserVotes(updatedVotes);
      setCostumes(updatedCostumes);
      toast.success("Vote changed successfully!");
      setChangeVoteDialog((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error("Error changing vote:", error);
      toast.error("Failed to change vote");
    }
  };

  const votingStatus = getVotingStatus();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col gap-4 sm:gap-6">
          {!isVotingOpen && votingWindow && (
            <div className="bg-secondary/50 border border-secondary rounded-lg p-3 sm:p-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <p className="text-muted-foreground text-sm sm:text-base">{getVotingMessage()}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold">Costume Voting</h1>
              {votingStatus && (
                <Badge variant={votingStatus.variant as "secondary" | "destructive" | undefined} className={votingStatus.className}>
                  {votingStatus.label}
                </Badge>
              )}
            </div>
            {showSubmitButton && (
              <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Submit Your Costume</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogTitle>Submit Your Costume</DialogTitle>
                  <UserCostumeSubmission categories={categories} onSuccess={handleSubmitSuccess} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Instructions Section */}
          {instructions ? (
            <div className="bg-secondary/10 rounded-lg px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-sm text-muted-foreground">{instructions.instructions}</p>
            </div>
          ) : (
            <div className="bg-secondary/10 rounded-lg px-3 py-2 sm:px-4 sm:py-3">
              <div className="text-sm sm:text-base">Loading instructions...</div>
            </div>
          )}

          {/* Categories Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center gap-2 bg-secondary/5 rounded-lg p-2 sm:p-3 hover:bg-secondary/10 transition-colors">
                  <span className="font-medium text-sm sm:text-base">{category.name}</span>
                  <HoverCard openDelay={0} closeDelay={0}>
                    <HoverCardTrigger asChild>
                      <Button variant="ghost" className="p-0 h-auto hover:bg-transparent focus:ring-0">
                        <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent side="right" align="start" className="max-w-[250px] text-sm bg-popover p-3">
                      {category.description}
                    </HoverCardContent>
                  </HoverCard>
                </div>
              ))}
            </div>
          </div>

          {/* Costume Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[300px] sm:min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : costumes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {costumes.map((costume) => (
                <Dialog key={costume.id}>
                  <DialogTrigger asChild>
                    <button
                      className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary rounded-lg overflow-hidden"
                      onClick={(e) => {
                        if (!isVotingOpen) {
                          e.preventDefault();
                          toast.error(getVotingMessage());
                        }
                      }}
                    >
                      <div className="aspect-square relative bg-secondary/10 rounded-lg p-2">
                        <img
                          src={costume.photoUrl}
                          alt={costume.characterName}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-costume.jpg";
                          }}
                        />
                      </div>
                      <h3 className="mt-2 text-sm font-medium truncate px-2">{costume.characterName}</h3>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogTitle>{costume.characterName}</DialogTitle>
                    <div className="flex flex-col gap-4">
                      <div className="relative aspect-square bg-secondary/10 rounded-lg">
                        <img
                          src={costume.photoUrl}
                          alt={costume.characterName}
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-costume.jpg";
                          }}
                        />
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold">{costume.characterName}</h2>
                        {(() => {
                          const isOwnSubmission = currentUser?.id === costume.submittedBy;
                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {isOwnSubmission ? (
                                <div className="col-span-full text-center p-4 bg-secondary/10 rounded-lg">
                                  <p className="text-muted-foreground">This is your costume submission</p>
                                </div>
                              ) : (
                                categories.map((category) => {
                                  const hasVoted = userVotes.some((vote) => vote.costumeId === costume.id && vote.category === category.tag);
                                  const hasVotedForThisCostume = userVotes.some((vote) => vote.category === category.tag && vote.costumeId === costume.id);
                                  console.log("Voting button state:", {
                                    category: category.name,
                                    costumeId: costume.id,
                                    hasVoted,
                                    isOwnSubmission,
                                    currentUserId: currentUser?.id,
                                    submittedBy: costume.submittedBy,
                                  });
                                  return (
                                    <Button
                                      key={category.id}
                                      variant={hasVoted ? "secondary" : "default"}
                                      className="w-full justify-start"
                                      disabled={!isVotingOpen}
                                      onClick={() => handleVote(costume.id, category.tag)}
                                    >
                                      {category.name}
                                      {hasVoted && hasVotedForThisCostume && <span className="ml-auto">✓</span>}
                                      {hasVoted && !hasVotedForThisCostume && <span className="ml-auto text-muted-foreground">(Vote for this instead?)</span>}
                                    </Button>
                                  );
                                })
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-6 sm:py-8">No costumes submitted yet.</div>
          )}
        </div>
      </div>

      {/* Add the ChangeVoteDialog component */}
      <ChangeVoteDialog
        isOpen={changeVoteDialog.isOpen}
        onClose={() => setChangeVoteDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleVoteChangeConfirm}
        categoryName={changeVoteDialog.categoryName}
      />
    </Layout>
  );
}
