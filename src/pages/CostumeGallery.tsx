import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getCostumes, getUserVotes, getCostumeCategories, getVotingWindow } from "@/lib/firebase";
import { Costume, Vote, CostumeCategory, VotingWindow } from "@/types";
import CostumeCard from "@/components/CostumeCard";
import UserCostumeSubmission from "@/components/UserCostumeSubmission";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Layout } from "@/components/ui/Layout";
import { toast } from "sonner";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CostumeGallery() {
  const { currentUser } = useAuth();
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [categories, setCategories] = useState<CostumeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCostume, setSelectedCostume] = useState<Costume | null>(null);
  const [votingWindow, setVotingWindow] = useState<VotingWindow | null>(null);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [fetchedCostumes, fetchedVotes, fetchedCategories, votingWindowData] = await Promise.all([
        getCostumes(),
        currentUser ? getUserVotes(currentUser.uid) : Promise.resolve([]),
        getCostumeCategories(),
        getVotingWindow(),
      ]);
      setCostumes(fetchedCostumes);
      setUserVotes(fetchedVotes);
      setCategories(fetchedCategories);
      setVotingWindow(votingWindowData);

      if (votingWindowData) {
        const now = new Date();
        if (votingWindowData.startDateTime && votingWindowData.endDateTime) {
          const startTime = votingWindowData.startDateTime.toDate();
          const endTime = votingWindowData.endDateTime.toDate();
          setIsVotingOpen(now >= startTime && now <= endTime);
        } else if (votingWindowData.startTime && votingWindowData.endTime) {
          const [startHour, startMinute] = votingWindowData.startTime.split(":").map(Number);
          const [endHour, endMinute] = votingWindowData.endTime.split(":").map(Number);
          const startTime = new Date();
          startTime.setHours(startHour, startMinute, 0, 0);
          const endTime = new Date();
          endTime.setHours(endHour, endMinute, 0, 0);
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
    if (currentUser) {
      const updatedVotes = await getUserVotes(currentUser.uid);
      setUserVotes(updatedVotes);
    }
  };

  const getVotingMessage = () => {
    if (!votingWindow) return null;
    let message = votingWindow.message || "";
    if (votingWindow.startDateTime) {
      const startTime = format(votingWindow.startDateTime.toDate(), "h:mm a");
      message = message.replace("{time}", startTime);
    } else if (votingWindow.startTime) {
      const [hour, minute] = votingWindow.startTime.split(":").map(Number);
      const time = format(new Date().setHours(hour, minute), "h:mm a");
      message = message.replace("{time}", time);
    }
    return message;
  };

  const handleSubmitSuccess = () => {
    setIsSubmitDialogOpen(false);
    fetchData();
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          {!isVotingOpen && votingWindow && (
            <div className="bg-secondary/50 border border-secondary rounded-lg p-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <p className="text-muted-foreground">{getVotingMessage()}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Costume Gallery</h1>
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

          {/* Categories Section */}
          <div className="grid gap-4 md:grid-cols-2">
            {categories.map((category) => (
              <Card key={category.id} className="bg-secondary/10">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Costume Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : costumes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {costumes.map((costume) => (
                <Dialog key={costume.id}>
                  <DialogTrigger asChild>
                    <button className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary rounded-lg overflow-hidden">
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
                              <Button
                                key={category.id}
                                onClick={() => {
                                  handleVote();
                                  // Close dialog after voting
                                  const dialogElement = document.querySelector('[role="dialog"]');
                                  if (dialogElement) {
                                    const closeButton = dialogElement.querySelector('[aria-label="Close"]');
                                    if (closeButton instanceof HTMLElement) {
                                      closeButton.click();
                                    }
                                  }
                                }}
                                disabled={!isVotingOpen || !currentUser || hasVoted}
                                variant={hasVoted ? "secondary" : "default"}
                                className="w-full h-auto min-h-[44px] whitespace-normal py-2 px-3 text-sm"
                              >
                                {hasVoted ? <span className="line-clamp-2">Voted for {category.name}</span> : <span className="line-clamp-2">Vote for {category.name}</span>}
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
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No costumes found</h3>
              <p className="text-muted-foreground">Be the first to submit a costume!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
