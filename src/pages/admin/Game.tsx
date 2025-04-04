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
        setQuestions(questionsData || []); // Ensure we always have an array

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
    if (!gameId || !game) return;

    try {
      // Check if game is scheduled and not yet ready to start
      if (game.scheduledStartTime) {
        const startTime = game.scheduledStartTime.toDate();
        const now = new Date();
        if (startTime > now) {
          toast.error("Cannot start a scheduled game before its start time");
          return;
        }
      }

      await startGame(gameId);

      // Update local state
      setGame((prev) => (prev ? { ...prev, status: "active", startedAt: Timestamp.fromDate(new Date()) } : null));

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
      setGame((prev) => (prev ? { ...prev, status: "ended", endedAt: Timestamp.fromDate(new Date()) } : null));

      toast.success("Game ended successfully");
      setShowEndDialog(false);
    } catch (error) {
      console.error("Error ending game:", error);
      toast.error("Failed to end game");
    }
  };

  const getStatusBadge = (status: GameStatus) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "scheduled":
        return <Badge variant="default">Scheduled</Badge>;
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

  if (!game || isLoading) {
    return (
      <AdminLayout
        title="Loading..."
        subtitle="Please wait"
        breadcrumbs={[
          { label: "Games", href: "/admin/games" },
          { label: "Loading...", href: "#" },
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-[#FF3D00] border-t-transparent rounded-full" />
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
        <div className="flex flex-wrap gap-2 justify-between items-center bg-[#1a1a1a] p-4 rounded-lg">
          <div className="flex items-center gap-2">
            {getStatusBadge(game.status)}
            <span className="text-sm text-gray-400">Created {formatTimestamp(game.createdAt)}</span>
          </div>

          <div className="flex gap-2">
            {/* Only show Start button for draft games or scheduled games that have reached their start time */}
            {(game.status === "draft" || (game.status === "scheduled" && game.scheduledStartTime && game.scheduledStartTime.toDate() <= new Date())) && (
              <Button onClick={() => setShowStartDialog(true)} className="bg-gradient-to-r from-[#FF3D00] to-[#FFD700] text-white hover:opacity-90">
                <Play className="h-4 w-4 mr-2" />
                Start Game
              </Button>
            )}

            {game.status === "active" && (
              <Button variant="destructive" onClick={() => setShowEndDialog(true)} className="bg-red-600 text-white hover:bg-red-700">
                <StopCircle className="h-4 w-4 mr-2" />
                End Game
              </Button>
            )}

            {/* Only allow editing for draft or scheduled games */}
            {(game.status === "draft" || game.status === "scheduled") && (
              <Button variant="outline" onClick={() => navigate(`/admin/games/${gameId}/edit`)} className="border-[#444] text-gray-400 hover:text-white hover:border-[#FF3D00]">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}

            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="bg-red-600 text-white hover:bg-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Show scheduling info for scheduled games */}
        {game.status === "scheduled" && game.scheduledStartTime && (
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-[#FF3D00]" />
                <div>
                  <h4 className="text-sm font-medium text-white">Scheduled Start</h4>
                  <p className="text-sm text-gray-400">{formatTimestamp(game.scheduledStartTime)}</p>
                </div>
                {game.expirationTime && (
                  <>
                    <Clock className="h-5 w-5 text-[#FFD700] ml-6" />
                    <div>
                      <h4 className="text-sm font-medium text-white">Expires</h4>
                      <p className="text-sm text-gray-400">{formatTimestamp(game.expirationTime)}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Game Tabs */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full md:w-auto md:flex bg-[#222] border-b border-[#333]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#333] data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="questions" className="data-[state=active]:bg-[#333] data-[state=active]:text-white">
              Questions ({questions.length})
            </TabsTrigger>
            <TabsTrigger value="participants" className="data-[state=active]:bg-[#333] data-[state=active]:text-white">
              Participants ({participants.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center text-white">
                    <Settings className="h-4 w-4 mr-2 text-gray-400" />
                    Game Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Public Game</dt>
                      <dd className="text-white">{game.isPublic ? "Yes" : "No"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Max Participants</dt>
                      <dd className="text-white">{game.maxParticipants}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Time Limit</dt>
                      <dd className="text-white">{game.timeLimit} seconds</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Hints Enabled</dt>
                      <dd className="text-white">{game.enableHints ? "Yes" : "No"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Bonus Questions</dt>
                      <dd className="text-white">{game.enableBonusQuestions ? "Yes" : "No"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Post-Game Review</dt>
                      <dd className="text-white">{game.enablePostGameReview ? "Yes" : "No"}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center text-white">
                    <HelpCircle className="h-4 w-4 mr-2 text-gray-400" />
                    Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Total Questions</dt>
                      <dd className="text-white">{questions.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Current Question</dt>
                      <dd className="text-white">
                        {game.currentQuestionIndex + 1} of {questions.length}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Difficulty Levels</dt>
                      <dd className="text-white">
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
                  <Button variant="outline" className="w-full border-[#444] text-gray-400 hover:text-white hover:border-[#FF3D00]" onClick={() => setActiveTab("questions")}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Questions
                  </Button>
                </CardFooter>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center text-white">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    Participants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Current Participants</dt>
                      <dd className="text-white">
                        {participants.length} of {game.maxParticipants}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Active Players</dt>
                      <dd className="text-white">{participants.filter((p) => p.status === "active").length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Completed</dt>
                      <dd className="text-white">{participants.filter((p) => p.status === "completed").length}</dd>
                    </div>
                  </dl>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full border-[#444] text-gray-400 hover:text-white hover:border-[#FF3D00]" onClick={() => setActiveTab("participants")}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Participants
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <Card className="bg-[#1a1a1a] border-[#333]">
              <CardHeader>
                <CardTitle className="text-white">Game Timeline</CardTitle>
                <CardDescription className="text-gray-400">Important events and timestamps for this game</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-[#333] p-1 rounded-full">
                      <Calendar className="h-5 w-5 text-[#FF3D00]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Created</h4>
                      <p className="text-sm text-gray-400">{formatTimestamp(game.createdAt)}</p>
                    </div>
                  </div>

                  {game.startedAt && (
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-[#333] p-1 rounded-full">
                        <Play className="h-5 w-5 text-[#FFD700]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white">Started</h4>
                        <p className="text-sm text-gray-400">{formatTimestamp(game.startedAt)}</p>
                      </div>
                    </div>
                  )}

                  {game.endedAt && (
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-[#333] p-1 rounded-full">
                        <StopCircle className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white">Ended</h4>
                        <p className="text-sm text-gray-400">{formatTimestamp(game.endedAt)}</p>
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
              <h3 className="text-lg font-medium text-white">Game Questions</h3>
              <Button onClick={() => navigate(`/admin/games/${gameId}/edit`)} className="bg-gradient-to-r from-[#FF3D00] to-[#FFD700] text-white hover:opacity-90">
                <Edit className="h-4 w-4 mr-2" />
                Edit Questions
              </Button>
            </div>

            {questions.length === 0 ? (
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="text-center py-8">
                  <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Questions Added</h3>
                  <p className="text-gray-400 mb-4">This game doesn't have any questions yet.</p>
                  <Button onClick={() => navigate(`/admin/games/${gameId}/edit`)} className="bg-gradient-to-r from-[#FF3D00] to-[#FFD700] text-white hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Questions
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <Card key={question.id} className="bg-[#1a1a1a] border-[#333]">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-2">{question.text}</h4>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="bg-[#222] text-gray-400 border-[#444]">
                              Level {question.level}
                            </Badge>
                            <Badge variant="outline" className="bg-[#222] text-gray-400 border-[#444]">
                              {question.type}
                            </Badge>
                            <Badge variant="outline" className="bg-[#222] text-gray-400 border-[#444]">
                              {question.difficulty}
                            </Badge>
                          </div>
                          {question.options && (
                            <div className="mt-4 space-y-2">
                              <p className="text-sm text-gray-400">Options:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {question.options.map((option, optionIndex) => (
                                  <div
                                    key={optionIndex}
                                    className={`p-2 rounded-md border ${
                                      optionIndex === question.correctAnswer ? "border-green-500 bg-green-500/10 text-green-500" : "border-[#444] bg-[#222] text-gray-400"
                                    }`}
                                  >
                                    {option}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-gray-400 ml-4">#{index + 1}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">Game Participants</h3>
              <Button onClick={() => navigate(`/admin/games/${gameId}/players`)} className="bg-gradient-to-r from-[#FF3D00] to-[#FFD700] text-white hover:opacity-90">
                <Users className="h-4 w-4 mr-2" />
                Manage Participants
              </Button>
            </div>

            {participants.length === 0 ? (
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Participants Yet</h3>
                  <p className="text-gray-400">No one has joined this game yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {participants.map((participant) => (
                  <Card key={participant.id} className="bg-[#1a1a1a] border-[#333]">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-white font-medium">{participant.name}</h4>
                          <p className="text-gray-400 text-sm">Joined {formatTimestamp(participant.joinedAt)}</p>
                        </div>
                        <Badge variant="outline" className="bg-[#222] text-gray-400 border-[#444]">
                          {participant.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Alert Dialogs */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-[#1a1a1a] border-[#333]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Are you sure you want to delete this game?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                This action cannot be undone. This will permanently delete the game and all associated data including questions and participant records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#222] text-gray-400 border-[#444] hover:bg-[#333] hover:text-white">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteGame} className="bg-red-600 text-white hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showStartDialog} onOpenChange={setShowStartDialog}>
          <AlertDialogContent className="bg-[#1a1a1a] border-[#333]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Start this game?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                {game.scheduledStartTime
                  ? "This scheduled game is ready to start. Players will be able to join and play once you start the game."
                  : "This will make the game active and allow participants to join and start playing. Make sure you have added all the questions you want to include."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#222] text-gray-400 border-[#444] hover:bg-[#333] hover:text-white">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleStartGame} className="bg-gradient-to-r from-[#FF3D00] to-[#FFD700] text-white hover:opacity-90">
                Start Game
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
          <AlertDialogContent className="bg-[#1a1a1a] border-[#333]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">End this game?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                This will end the game for all participants. They will no longer be able to submit answers, and final scores will be calculated.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#222] text-gray-400 border-[#444] hover:bg-[#333] hover:text-white">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleEndGame} className="bg-red-600 text-white hover:bg-red-700">
                End Game
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default GameDetail;
