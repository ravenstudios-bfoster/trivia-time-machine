import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { createGame, getGameById, updateGame, getQuestions, addQuestionsToGame, getGameQuestions, removeQuestionFromGame } from "@/lib/firebase";
import { Game, Level, Question, GameStatus } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Save, ArrowLeft, Plus, Clock, Users, HelpCircle, Trash2, Search, Filter, Car, Calendar, Settings, ListChecks } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Timestamp } from "firebase/firestore";
import { format, addMinutes } from "date-fns";
import QuestionSelectorDialog from "../../components/QuestionSelectorDialog";
import { doc, addDoc, collection, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "draft", "scheduled", "completed", "ended"]).default("draft"),
  timeLimit: z.number().min(5, "Minimum 5 seconds per question").max(120, "Maximum 120 seconds per question").default(30),
  enableHints: z.boolean().default(false),
  enableBonusQuestions: z.boolean().default(false),
  enablePostGameReview: z.boolean().default(false),
  allowedLevels: z.array(z.string()).min(1, "Select at least one level").default([]),
});

type FormValues = z.infer<typeof formSchema>;

const GameForm = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(50);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
      timeLimit: 30,
      enableHints: false,
      enableBonusQuestions: false,
      enablePostGameReview: false,
      allowedLevels: [],
    },
    mode: "onChange",
  });

  // Add validation debugging
  useEffect(() => {
    const subscription = form.watch(async (data) => {
      try {
        // Parse the current form data through the schema
        const result = await formSchema.safeParseAsync(data);
        console.log("Zod validation result:", result);

        if (!result.success) {
          console.log("Validation errors:", result.error.errors);
        }
      } catch (error) {
        console.error("Validation error:", error);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Load game data if editing
  useEffect(() => {
    const loadGame = async () => {
      if (!gameId) return;

      try {
        setIsLoading(true);
        const gameDoc = await getDoc(doc(db, "games", gameId));
        if (!gameDoc.exists()) {
          toast.error("Game not found");
          navigate("/admin/games");
          return;
        }

        const game = gameDoc.data() as Game;
        form.reset({
          title: game.title,
          description: game.description || "",
          status: game.status,
          timeLimit: game.timeLimit,
          enableHints: game.enableHints,
          enableBonusQuestions: game.enableBonusQuestions,
          enablePostGameReview: game.enablePostGameReview,
          allowedLevels: game.allowedLevels,
        });

        // Load game questions
        const questions = await getGameQuestions(gameId);
        setGameQuestions(questions);
        setSelectedQuestions(questions);
      } catch (error) {
        console.error("Error loading game:", error);
        toast.error("Failed to load game");
      } finally {
        setIsLoading(false);
      }
    };

    loadGame();
  }, [gameId, navigate, form]);

  // Load available questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const questions = await getQuestions();
        setAvailableQuestions(questions);
      } catch (error) {
        console.error("Error loading questions:", error);
        toast.error("Failed to load questions");
      }
    };

    loadQuestions();
  }, []);

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    if (!currentUser) {
      toast.error("You must be logged in to create or edit games");
      return;
    }

    setIsLoading(true);

    try {
      const gameData = {
        title: values.title,
        description: values.description || "",
        status: values.status,
        timeLimit: values.timeLimit,
        enableHints: values.enableHints,
        enableBonusQuestions: values.enableBonusQuestions,
        enablePostGameReview: values.enablePostGameReview,
        allowedLevels: values.allowedLevels,
        questionIds: selectedQuestions.map((q) => q.id),
        updatedAt: Timestamp.now(),
      };

      if (gameId) {
        // Update existing game
        await updateGame(gameId, gameData);
        if (selectedQuestions.length > 0) {
          await addQuestionsToGame(
            gameId,
            selectedQuestions.map((q) => q.id)
          );
        }
        toast.success("Game updated successfully");
      } else {
        // Create new game
        const newGameData = {
          ...gameData,
          currentQuestionIndex: 0,
          adminId: currentUser.uid,
          participants: [],
          participantCount: 0,
          createdAt: Timestamp.now(),
        };
        const newGameId = await createGame(newGameData);
        if (selectedQuestions.length > 0) {
          await addQuestionsToGame(
            newGameId,
            selectedQuestions.map((q) => q.id)
          );
        }
        toast.success("Game created successfully");
      }
      navigate("/admin/games");
    } catch (error) {
      console.error("Error saving game:", error);
      toast.error("Failed to save game");
    } finally {
      setIsLoading(false);
    }
  };

  // Add question to game
  const addQuestionToGame = async (question: Question) => {
    if (!gameId) {
      // If creating a new game, just add to local state
      if (!gameQuestions.some((q) => q.id === question.id)) {
        setGameQuestions([...gameQuestions, question]);
      }
      return;
    }

    try {
      // Add to Firebase
      await addQuestionsToGame(gameId, [question.id]);

      // Update local state
      if (!gameQuestions.some((q) => q.id === question.id)) {
        setGameQuestions([...gameQuestions, question]);
      }

      toast.success("Question added to game");
    } catch (error) {
      console.error("Error adding question to game:", error);
      toast.error("Failed to add question to game");
    }
  };

  // Remove question from game
  const removeQuestionFromGameHandler = async (questionId: string) => {
    if (!gameId) {
      // If creating a new game, just remove from local state
      setGameQuestions(gameQuestions.filter((q) => q.id !== questionId));
      return;
    }

    try {
      // Remove from Firebase
      await removeQuestionFromGame(gameId, questionId);

      // Update local state
      setGameQuestions(gameQuestions.filter((q) => q.id !== questionId));

      toast.success("Question removed from game");
    } catch (error) {
      console.error("Error removing question from game:", error);
      toast.error("Failed to remove question from game");
    }
  };

  // Filter available questions
  const filteredQuestions = availableQuestions
    .filter((q) => !gameQuestions.some((gq) => gq.id === q.id)) // Exclude questions already in the game
    .filter((q) => {
      // Apply search filter
      if (searchTerm && !q.text.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Apply level filter
      if (levelFilter !== null && q.level !== levelFilter) {
        return false;
      }

      return true;
    });

  const steps = [
    { id: "basics", label: "Basic Info", icon: Clock },
    { id: "questions", label: "Questions", icon: ListChecks },
  ];

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    setProgress((step + 1) * 50);
  };

  const openQuestionSelector = () => {
    setShowQuestionSelector(true);
  };

  const handleQuestionSelect = (questions: Question[]) => {
    setSelectedQuestions(questions);
    setShowQuestionSelector(false);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = selectedQuestions.filter((_, i) => i !== index);
    setSelectedQuestions(newQuestions);
  };

  return (
    <AdminLayout
      title="Create Game"
      subtitle="Set up a new trivia game"
      breadcrumbs={[
        { label: "Games", href: "/admin/games" },
        { label: gameId ? "Edit Game" : "Create Game", href: gameId ? `/admin/games/${gameId}/edit` : "/admin/games/new" },
      ]}
    >
      <div className="max-w-5xl mx-auto">
        <Card className="border-t-4 border-t-[#FF3D00] bg-[#1a1a1a] shadow-xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-[#FF3D00]">Back to the Future Trivia Game</CardTitle>
                <CardDescription className="text-gray-400">Create an exciting trivia experience for your players</CardDescription>
              </div>
              <Car className="h-12 w-12 text-[#FFD700]" />
            </div>
            <Progress value={progress} className="h-2 bg-[#333]">
              <div className="h-full bg-gradient-to-r from-[#FF3D00] to-[#FFD700]" />
            </Progress>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
                onSubmit={(e) => {
                  console.log("Form submit event triggered");
                  console.log("Form is valid:", form.formState.isValid);
                  console.log("Form errors:", form.formState.errors);
                  console.log("Current values:", form.getValues());
                  // Validate the form data explicitly
                  const formData = form.getValues();
                  formSchema.parse(formData);
                  form.handleSubmit(onSubmit)(e);
                }}
                className="space-y-6"
              >
                <Tabs value={steps[currentStep].id} className="space-y-6">
                  <TabsList className="grid grid-cols-2 gap-4 bg-[#333] p-1 rounded-lg">
                    {steps.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <TabsTrigger
                          key={step.id}
                          value={step.id}
                          onClick={() => handleStepChange(index)}
                          className={`flex items-center gap-2 transition-all duration-200 ${
                            currentStep === index ? "bg-gradient-to-r from-[#FF3D00] to-[#FFD700] text-white" : "text-gray-400 hover:text-white hover:bg-[#444]"
                          }`}
                          disabled={isLoading}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="hidden sm:inline">{step.label}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  <TabsContent value="basics" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Game Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter game title" className="bg-[#222] border-[#444] text-white placeholder:text-gray-500" {...field} />
                          </FormControl>
                          <FormDescription className="text-gray-500">Give your game a catchy title</FormDescription>
                          <FormMessage className="text-[#FF3D00]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter game description" className="min-h-[100px] bg-[#222] border-[#444] text-white placeholder:text-gray-500" {...field} />
                          </FormControl>
                          <FormDescription className="text-gray-500">Describe what makes this game special</FormDescription>
                          <FormMessage className="text-[#FF3D00]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timeLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Time per Question (seconds)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={5}
                              max={120}
                              placeholder="Enter time in seconds"
                              className="bg-[#222] border-[#444] text-white placeholder:text-gray-500"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription className="text-gray-500">Set the time limit for each question (5-120 seconds)</FormDescription>
                          <FormMessage className="text-[#FF3D00]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="allowedLevels"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Game Level</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="level1"
                                  checked={field.value.includes("1")}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked ? [...field.value, "1"] : field.value.filter((v) => v !== "1");
                                    field.onChange(newValue);
                                  }}
                                  className="bg-[#222] border-[#444] data-[state=checked]:bg-yellow-500"
                                />
                                <label htmlFor="level1" className="text-sm font-medium leading-none text-gray-300 cursor-pointer">
                                  Level 1 (Prize Eligible)
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="level2"
                                  checked={field.value.includes("2")}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked ? [...field.value, "2"] : field.value.filter((v) => v !== "2");
                                    field.onChange(newValue);
                                  }}
                                  className="bg-[#222] border-[#444] data-[state=checked]:bg-yellow-500"
                                />
                                <label htmlFor="level2" className="text-sm font-medium leading-none text-gray-300 cursor-pointer">
                                  Level 2 (Prize Eligible)
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="level3"
                                  checked={field.value.includes("3")}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked ? [...field.value, "3"] : field.value.filter((v) => v !== "3");
                                    field.onChange(newValue);
                                  }}
                                  className="bg-[#222] border-[#444] data-[state=checked]:bg-purple-500"
                                />
                                <label htmlFor="level3" className="text-sm font-medium leading-none text-gray-300 cursor-pointer">
                                  Level 3 (Bragging Rights)
                                </label>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription className="text-gray-500">Select which level(s) this game is available for</FormDescription>
                          <FormMessage className="text-[#FF3D00]" />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="questions" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-300">Selected Questions</h3>
                        <Button type="button" variant="outline" onClick={openQuestionSelector} className="border-[#444] text-gray-400 hover:text-white hover:border-[#FF3D00]">
                          Add Questions
                        </Button>
                      </div>

                      <div className="border border-[#444] rounded-lg divide-y divide-[#444]">
                        {selectedQuestions.map((question, index) => (
                          <div key={question.id} className="p-4 flex items-center justify-between bg-[#222]">
                            <div className="flex-1">
                              <p className="text-white">{question.text}</p>
                              <p className="text-sm text-gray-400">
                                Level {question.level} • {question.type} • {question.difficulty}
                              </p>
                            </div>
                            <Button type="button" variant="ghost" onClick={() => removeQuestion(index)} className="text-gray-400 hover:text-[#FF3D00]">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-between p-6 border-t border-[#333] mt-6">
                  <Button type="button" variant="outline" onClick={() => navigate("/admin/games")} className="border-[#444] text-gray-400 hover:text-white hover:border-[#FF3D00]">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>

                  <div className="flex gap-2">
                    {currentStep > 0 && (
                      <Button type="button" variant="outline" onClick={() => handleStepChange(currentStep - 1)} className="border-[#444] text-gray-400 hover:text-white hover:border-[#FF3D00]">
                        Previous
                      </Button>
                    )}
                    {currentStep < steps.length - 1 ? (
                      <Button
                        type="button"
                        onClick={(e) => {
                          console.log("Next button clicked");
                          console.log("Current step:", currentStep);
                          e.preventDefault();
                          handleStepChange(currentStep + 1);
                        }}
                        className="bg-gradient-to-r from-[#FF3D00] to-[#FFD700] text-white hover:opacity-90"
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        onClick={() => {
                          console.log("Create/Update Game button clicked");
                          console.log("Form state:", {
                            isDirty: form.formState.isDirty,
                            isValid: form.formState.isValid,
                            errors: form.formState.errors,
                            values: form.getValues(),
                          });
                        }}
                        disabled={isLoading || selectedQuestions.length === 0}
                        className="bg-gradient-to-r from-[#FF3D00] to-[#FFD700] text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            {gameId ? "Updating..." : "Creating..."}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {gameId ? "Update Game" : "Create Game"}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <QuestionSelectorDialog open={showQuestionSelector} onOpenChange={setShowQuestionSelector} onSelect={handleQuestionSelect} selectedQuestions={selectedQuestions} />
    </AdminLayout>
  );
};

export default GameForm;
