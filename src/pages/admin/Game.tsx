import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getGameById, getGameQuestions, getParticipants, deleteGame, startGame, endGame } from "@/lib/firebase";
import { Game, Question, Participant, GameStatus } from "@/types";
import { toast } from "sonner";
import { Edit, Trash2, ArrowLeft, Play, StopCircle, Clock, Users, Calendar, HelpCircle, Settings, Eye, Plus } from "lucide-react";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";

const GameDetail = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const loadGameData = async () => {
      if (!gameId) return;

      try {
        setIsLoading(true);

        // Load game details
        const gameData = await getGameById(gameId);
        if (!gameData) {
          toast.error("Game not found");
          navigate("/admin/games");
          return;
        }
        setGame(gameData);

        // Load game questions
        const questionsData = await getGameQuestions(gameId);
        setQuestions(questionsData);

        // Load participants
        const participantsData = await getParticipants(gameId);
        setParticipants(participantsData);
      } catch (error) {
        console.error("Error loading game data:", error);
        toast.error("Failed to load game data");
      } finally {
        setIsLoading(false);
      }
    };

    loadGameData();
  }, [gameId, navigate]);

  const handleDeleteGame = async () => {
    if (!gameId) return;

    try {
      await deleteGame(gameId);
      toast.success("Game deleted successfully");
      navigate("/admin/games");
    } catch (error) {
      console.error("Error deleting game:", error);
      toast.error("Failed to delete game");
    }
  };

  const handleStartGame = async () => {
    if (!gameId) return;

    try {
      await startGame(gameId);

      // Update local state
      setGame((prev) => (prev ? { ...prev, status: "active" } : null));

      toast.success("Game started successfully");
      setShowStartDialog(false);
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game");
    }
  };

  const handleEndGame = async () => {
    if (!gameId) return;

    try {
      await endGame(gameId);

      // Update local state
      setGame((prev) => (prev ? { ...prev, status: "ended" } : null));

      toast.success("Game ended successfully");
      setShowEndDialog(false);
    } catch (error) {
      console.error("Error ending game:", error);
      toast.error("Failed to end game");
    }
  };

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

  const formatTimestamp = (timestamp: Timestamp | Date | undefined | null) => {
    if (!timestamp) return "N/A";

    try {
      // If it's a Firebase Timestamp
      if ("toDate" in timestamp) {
        return format(timestamp.toDate(), "MMM d, yyyy h:mm a");
      }
      // If it's a Date object
      return format(timestamp, "MMM d, yyyy h:mm a");
    } catch (error) {
      return "Invalid date";
    }
  };

  if (isLoading) {
    return (
      <AdminLayout
        title="Loading Game..."
        subtitle="Please wait"
        breadcrumbs={[
          { label: "Games", href: "/admin/games" },
          { label: "Game Details", href: `/admin/games/${gameId}` },
        ]}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!game) {
    return (
      <AdminLayout title="Game Not Found" subtitle="The requested game could not be found" breadcrumbs={[{ label: "Games", href: "/admin/games" }]}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Game Not Found</h2>
          <p className="text-muted-foreground mb-6">The game you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => navigate("/admin/games")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Games
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={game.title}
      subtitle={game.description || "No description provided"}
      breadcrumbs={[
        { label: "Games", href: "/admin/games" },
        { label: game.title, href: `/admin/games/${gameId}` },
      ]}
    >
      <div className="space-y-6">
        {/* Game Actions */}
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex items-center gap-2">
            {getStatusBadge(game.status)}
            <span className="text-sm text-muted-foreground">Created {formatTimestamp(game.createdAt)}</span>
          </div>

          <div className="flex gap-2">
            {game.status === "scheduled" && (
              <Button onClick={() => setShowStartDialog(true)}>
                <Play className="h-4 w-4 mr-2" />
                Start Game
              </Button>
            )}

            {game.status === "active" && (
              <Button variant="destructive" onClick={() => setShowEndDialog(true)}>
                <StopCircle className="h-4 w-4 mr-2" />
                End Game
              </Button>
            )}

            <Button variant="outline" onClick={() => navigate(`/admin/games/${gameId}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>

            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Game Tabs */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full md:w-auto md:flex">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
            <TabsTrigger value="participants">Participants ({participants.length})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                    Game Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Public Game</dt>
                      <dd>{game.isPublic ? "Yes" : "No"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Max Participants</dt>
                      <dd>{game.maxParticipants}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Time Limit</dt>
                      <dd>{game.timeLimit} seconds</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Hints Enabled</dt>
                      <dd>{game.enableHints ? "Yes" : "No"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Bonus Questions</dt>
                      <dd>{game.enableBonusQuestions ? "Yes" : "No"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Post-Game Review</dt>
                      <dd>{game.enablePostGameReview ? "Yes" : "No"}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <HelpCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                    Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Total Questions</dt>
                      <dd>{questions.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Current Question</dt>
                      <dd>
                        {game.currentQuestionIndex + 1} of {questions.length}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Difficulty Levels</dt>
                      <dd>
                        {game.allowedLevels && game.allowedLevels.length > 0
                          ? game.allowedLevels
                              .sort()
                              .map((level) => `Level ${level}`)
                              .join(", ")
                          : "None"}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("questions")}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Questions
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    Participants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Current Participants</dt>
                      <dd>
                        {participants.length} of {game.maxParticipants}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Active Players</dt>
                      <dd>{participants.filter((p) => p.status === "active").length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Completed</dt>
                      <dd>{participants.filter((p) => p.status === "completed").length}</dd>
                    </div>
                  </dl>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("participants")}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Participants
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Game Timeline</CardTitle>
                <CardDescription>Important events and timestamps for this game</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-primary/20 p-1 rounded-full">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Created</h4>
                      <p className="text-sm text-muted-foreground">{formatTimestamp(game.createdAt)}</p>
                    </div>
                  </div>

                  {game.startedAt && (
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-green-500/20 p-1 rounded-full">
                        <Play className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Started</h4>
                        <p className="text-sm text-muted-foreground">{formatTimestamp(game.startedAt)}</p>
                      </div>
                    </div>
                  )}

                  {game.endedAt && (
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-red-500/20 p-1 rounded-full">
                        <StopCircle className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Ended</h4>
                        <p className="text-sm text-muted-foreground">{formatTimestamp(game.endedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Game Questions</h3>
              <Button onClick={() => navigate(`/admin/games/${gameId}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Questions
              </Button>
            </div>

            {questions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Questions Added</h3>
                  <p className="text-muted-foreground mb-4">This game doesn't have any questions yet.</p>
                  <Button onClick={() => navigate(`/admin/games/${gameId}/edit`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Questions
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <Card key={question.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">
                          {index + 1}. {question.text}
                        </CardTitle>
                        <div className="flex gap-1">
                          <Badge variant="outline">Level {question.level}</Badge>
                          <Badge variant="secondary">{question.type}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {question.type === "multiple-choice" && question.options && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className={`p-2 rounded-md border ${question.correctAnswer === optIndex ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}`}>
                              {option}
                              {question.correctAnswer === optIndex && <Badge className="ml-2 bg-green-500">Correct</Badge>}
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === "true-false" && question.options && (
                        <div className="grid grid-cols-2 gap-2">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className={`p-2 rounded-md border ${question.correctAnswer === optIndex ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}`}>
                              {option}
                              {question.correctAnswer === optIndex && <Badge className="ml-2 bg-green-500">Correct</Badge>}
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === "write-in" && (
                        <div className="p-2 rounded-md border border-green-500 bg-green-50 dark:bg-green-950/20">
                          <span className="font-medium">Correct Answer: </span>
                          {question.correctAnswer as string}
                        </div>
                      )}

                      {question.hint && (
                        <div className="mt-4">
                          <span className="text-sm font-medium">Hint: </span>
                          <span className="text-sm text-muted-foreground">{question.hint}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Game Participants</h3>
              <Button onClick={() => navigate(`/admin/games/${gameId}/players`)}>
                <Users className="h-4 w-4 mr-2" />
                Manage Participants
              </Button>
            </div>

            {participants.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Participants Yet</h3>
                  <p className="text-muted-foreground">No one has joined this game yet.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 p-3 bg-muted/50 text-xs font-medium">
                      <div className="col-span-4">Name</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Score</div>
                      <div className="col-span-2">Correct Answers</div>
                      <div className="col-span-2">Joined At</div>
                    </div>
                    <div className="divide-y">
                      {participants.map((participant) => (
                        <div key={participant.id} className="grid grid-cols-12 p-3 items-center text-sm">
                          <div className="col-span-4 font-medium">{participant.name}</div>
                          <div className="col-span-2">
                            <Badge variant={participant.status === "active" ? "default" : "secondary"}>{participant.status}</Badge>
                          </div>
                          <div className="col-span-2">{participant.score}</div>
                          <div className="col-span-2">{participant.correctAnswers}</div>
                          <div className="col-span-2 text-muted-foreground">{formatTimestamp(participant.joinedAt)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this game?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the game and all associated data including questions and participant records.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGame} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Start Game Confirmation Dialog */}
      <AlertDialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start this game?</AlertDialogTitle>
            <AlertDialogDescription>This will make the game active and allow participants to join and start playing. Make sure you have added all the questions you want to include.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartGame}>Start Game</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End Game Confirmation Dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this game?</AlertDialogTitle>
            <AlertDialogDescription>This will end the game for all participants. They will no longer be able to submit answers, and final scores will be calculated.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndGame} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              End Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default GameDetail;
