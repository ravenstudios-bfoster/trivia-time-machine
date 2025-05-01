import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCostumes, getUserVotes, getCostumeCategories, getVotingWindow, getCostumeInstructions } from "@/lib/firebase";
import { Costume, Vote, CostumeCategory, VotingWindow, CostumeInstructions } from "@/types";
import CostumeCard from "@/components/CostumeCard";
import UserCostumeSubmission from "@/components/UserCostumeSubmission";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Layout } from "@/components/ui/Layout";
import { toast } from "sonner";
import { format } from "date-fns";
import { Clock, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";

export default function CostumeVoting() {
  const { currentUser } = useAuth();
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [categories, setCategories] = useState<CostumeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCostume, setSelectedCostume] = useState<Costume | null>(null);
  const [votingWindow, setVotingWindow] = useState<VotingWindow | null>(null);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [instructions, setInstructions] = useState<CostumeInstructions | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fetchedCostumes, fetchedVotes, fetchedCategories, votingWindowData, instructionsData] = await Promise.all([
        getCostumes(),
        currentUser ? getUserVotes(currentUser.uid) : Promise.resolve([]),
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
    fetchData();
  }, [currentUser]);

  const handleVote = async () => {
    if (!isVotingOpen) {
      toast.error(getVotingMessage());
      return;
    }

    if (currentUser) {
      const updatedVotes = await getUserVotes(currentUser.uid);
      setUserVotes(updatedVotes);
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
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button>Submit Your Costume</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogTitle>Submit Your Costume</DialogTitle>
                <UserCostumeSubmission categories={categories} onSuccess={handleSubmitSuccess} />
              </DialogContent>
            </Dialog>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {categories.map((category) => {
                            const hasVoted = userVotes.some((vote) => vote.costumeId === costume.id && vote.category === category.tag);
                            return (
                              <Button key={category.id} variant={hasVoted ? "secondary" : "default"} className="w-full justify-start" disabled={hasVoted || !isVotingOpen} onClick={() => handleVote()}>
                                {category.name}
                                {hasVoted && <span className="ml-auto">✓</span>}
                              </Button>
                            );
                          })}
                        </div>
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
    </Layout>
  );
}
