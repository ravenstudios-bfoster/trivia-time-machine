import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { createQuestion, getQuestionById, updateQuestion } from "@/lib/firebase";
import { Question, QuestionType, Level, Difficulty } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Save, ArrowLeft, Plus, Trash2, Image, Video, HelpCircle, Lightbulb, FileText, Settings2, Film } from "lucide-react";

// Form schema
const questionFormSchema = z
  .object({
    text: z.string().min(3, "Question text must be at least 3 characters"),
    type: z.enum(["multiple-choice", "true-false", "write-in"] as const),
    level: z.number().min(1).max(3),
    difficulty: z.enum(["easy", "medium", "hard"] as const),
    topic: z.string().min(1, "Topic is required"),
    pointValue: z.number().min(1, "Points must be at least 1").default(10),
    timeLimit: z.number().min(5, "Time limit must be at least 5 seconds").default(30),
    options: z.array(z.string()).optional(),
    correctAnswer: z.union([z.number(), z.string()]).optional(),
    hint: z.string().optional(),
    hintPenalty: z.number().min(0, "Hint penalty must be at least 0").default(1),
    explanation: z.string().optional(),
    imageUrl: z.string().optional(),
    videoUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.type === "multiple-choice" || data.type === "true-false") && (data.correctAnswer === undefined || data.correctAnswer === null || data.correctAnswer === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "You must select a correct answer.",
        path: ["correctAnswer"],
      });
    }
  });

type QuestionFormValues = z.infer<typeof questionFormSchema>;

const QuestionForm = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(25);

  // Initialize form
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      text: "",
      type: "multiple-choice" as QuestionType,
      level: 1,
      difficulty: "medium" as Difficulty,
      topic: "",
      pointValue: 10,
      timeLimit: 30,
      options: ["", "", "", ""],
      correctAnswer: 0,
      hint: "",
      hintPenalty: 1,
      explanation: "",
      imageUrl: "",
      videoUrl: "",
    },
  });

  // Watch for question type changes
  const questionType = form.watch("type");
  const level = form.watch("level");

  // Load question data if editing
  useEffect(() => {
    const loadQuestion = async () => {
      if (!questionId) return;

      try {
        setIsLoading(true);
        const question = await getQuestionById(questionId);

        if (!question) {
          toast.error("Question not found");
          navigate("/admin/questions");
          return;
        }

        // Set form values
        form.reset({
          text: question.text,
          type: question.type,
          level: question.level,
          difficulty: question.difficulty,
          topic: question.topic,
          pointValue: question.pointValue || 10,
          timeLimit: question.timeLimit || 30,
          options: question.options || ["", "", "", ""],
          correctAnswer: question.correctAnswer !== undefined ? question.correctAnswer : 0,
          hint: question.hint || "",
          hintPenalty: question.hintPenalty || 1,
          explanation: question.explanation || "",
          imageUrl: question.imageUrl || "",
          videoUrl: question.videoUrl || "",
        });

        if (question.imageUrl) {
          setPreviewImage(question.imageUrl);
        }
      } catch (error) {
        console.error("Error loading question:", error);
        toast.error("Failed to load question");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestion();
  }, [questionId, navigate, form]);

  // Handle form submission
  const onSubmit = async (values: QuestionFormValues) => {
    try {
      setIsLoading(true);

      // Check for correctAnswer for MC/TF
      if ((values.type === "multiple-choice" || values.type === "true-false") && (values.correctAnswer === undefined || values.correctAnswer === null || values.correctAnswer === "")) {
        toast.error("You must select a correct answer.");
        setIsLoading(false);
        return;
      }

      // Prepare question data
      const questionData: Partial<Question> = {
        text: values.text,
        type: values.type,
        level: values.level as Level,
        difficulty: values.difficulty,
        topic: values.topic,
        pointValue: values.pointValue,
        timeLimit: values.timeLimit,
        // Convert undefined to null for optional fields
        hint: values.hint || null,
        hintPenalty: values.hintPenalty || 0,
        explanation: values.explanation || null,
        imageUrl: values.imageUrl || null,
        videoUrl: values.videoUrl || null,
      };

      // Add type-specific data
      if (values.type === "multiple-choice" || values.type === "true-false") {
        // Filter out empty options
        questionData.options = values.options?.filter((option) => option.trim() !== "") || [];

        // Ensure we have enough options
        if (values.type === "multiple-choice" && (questionData.options?.length || 0) < 2) {
          toast.error("Multiple choice questions must have at least 2 options");
          setIsLoading(false);
          return;
        }

        if (values.type === "true-false") {
          // Ensure true-false has exactly 2 options: True and False
          questionData.options = ["True", "False"];
        }

        // Ensure correctAnswer is a valid index
        if (typeof values.correctAnswer === "number") {
          if (values.correctAnswer >= (questionData.options?.length || 0)) {
            questionData.correctAnswer = 0;
          } else {
            questionData.correctAnswer = values.correctAnswer;
          }
        } else {
          questionData.correctAnswer = 0;
        }
      } else if (values.type === "write-in") {
        // For write-in questions, correctAnswer is a string
        questionData.correctAnswer = values.correctAnswer?.toString() || "";
        // Ensure write-in questions have no options
        questionData.options = null;
      }

      if (questionId) {
        // Update existing question
        await updateQuestion(questionId, questionData);
        toast.success("Question updated successfully");
      } else {
        // Create new question
        const newQuestionId = await createQuestion(questionData as Omit<Question, "id" | "createdAt" | "updatedAt" | "createdBy">);
        toast.success("Question created successfully");
        navigate(`/admin/questions/${newQuestionId}`);
      }
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Failed to save question");
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new option
  const addOption = () => {
    const currentOptions = form.getValues("options") || [];
    form.setValue("options", [...currentOptions, ""]);
  };

  // Remove an option
  const removeOption = (index: number) => {
    const currentOptions = form.getValues("options") || [];
    if (currentOptions.length <= 2) {
      toast.error("At least 2 options are required");
      return;
    }

    form.setValue(
      "options",
      currentOptions.filter((_, i) => i !== index)
    );

    // Update correctAnswer if needed
    const correctAnswer = form.getValues("correctAnswer");
    if (typeof correctAnswer === "number") {
      if (correctAnswer === index) {
        form.setValue("correctAnswer", 0);
      } else if (correctAnswer > index) {
        form.setValue("correctAnswer", correctAnswer - 1);
      }
    }
  };

  const steps = [
    { id: "basics", label: "Basic Info", icon: FileText },
    { id: "answers", label: "Answers", icon: Settings2 },
    { id: "media", label: "Media", icon: Film },
    { id: "hints", label: "Hints", icon: Lightbulb },
  ];

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    setProgress((step + 1) * 25);
  };

  return (
    <AdminLayout
      title="Create Question"
      subtitle="Add a new Back to the Future trivia question"
      breadcrumbs={[
        { label: "Questions", href: "/admin/questions" },
        { label: "Create Question", href: "/admin/questions/new" },
      ]}
    >
      <div className="max-w-5xl mx-auto">
        <Card className="border-t-4 border-t-[#FF3D00] bg-[#1a1a1a] shadow-xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-[#FF3D00]">Back to the Future Trivia</CardTitle>
                <CardDescription className="text-gray-400">Create an engaging question for your time-traveling adventure</CardDescription>
              </div>
              <Film className="h-12 w-12 text-[#FFD700]" />
            </div>
            <Progress value={progress} className="h-2 bg-[#333]">
              <div className="h-full bg-gradient-to-r from-[#FF3D00] to-[#FFD700]" />
            </Progress>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && currentStep < steps.length - 1) {
                    e.preventDefault();
                  }
                }}
              >
                <Tabs value={steps[currentStep].id} className="space-y-6">
                  <TabsList className="grid grid-cols-4 gap-4 bg-[#333] p-1 rounded-lg">
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

                  <TabsContent value="basics" className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="text"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Question Text</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter your Back to the Future trivia question..." className="min-h-[100px] bg-[#222] border-[#444] text-white placeholder:text-gray-500" {...field} />
                            </FormControl>
                            <FormDescription className="text-gray-500">Make sure your question is clear and specific to Back to the Future lore</FormDescription>
                            <FormMessage className="text-[#FF3D00]" />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Question Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-[#222] border-[#444] text-white">
                                    <SelectValue placeholder="Select question type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-[#222] border-[#444]">
                                  <SelectItem value="multiple-choice" className="text-white hover:bg-[#333]">
                                    Multiple Choice
                                  </SelectItem>
                                  <SelectItem value="true-false" className="text-white hover:bg-[#333]">
                                    True/False
                                  </SelectItem>
                                  <SelectItem value="write-in" className="text-white hover:bg-[#333]">
                                    Write-in
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-gray-500">Choose how players will answer this question</FormDescription>
                              <FormMessage className="text-[#FF3D00]" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Difficulty Level</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                                <FormControl>
                                  <SelectTrigger className="bg-[#222] border-[#444] text-white">
                                    <SelectValue placeholder="Select difficulty level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-[#222] border-[#444]">
                                  <SelectItem value="1" className="text-white hover:bg-[#333]">
                                    Level 1 - Casual Viewer
                                  </SelectItem>
                                  <SelectItem value="2" className="text-white hover:bg-[#333]">
                                    Level 2 - Official Fan
                                  </SelectItem>
                                  <SelectItem value="3" className="text-white hover:bg-[#333]">
                                    Level 3 - Biggest Fan
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-gray-500">
                                {level === 1 && "Basic knowledge from watching the movies"}
                                {level === 2 && "In-depth knowledge including DVD extras"}
                                {level === 3 && "Hardcore fan knowledge and trivia"}
                              </FormDescription>
                              <FormMessage className="text-[#FF3D00]" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="difficulty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Question Difficulty</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-[#222] border-[#444] text-white">
                                    <SelectValue placeholder="Select difficulty" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-[#222] border-[#444]">
                                  <SelectItem value="easy" className="text-white hover:bg-[#333]">
                                    Easy
                                  </SelectItem>
                                  <SelectItem value="medium" className="text-white hover:bg-[#333]">
                                    Medium
                                  </SelectItem>
                                  <SelectItem value="hard" className="text-white hover:bg-[#333]">
                                    Hard
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-gray-500">How challenging is this question within its level?</FormDescription>
                              <FormMessage className="text-[#FF3D00]" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="topic"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Topic</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-[#222] border-[#444] text-white">
                                    <SelectValue placeholder="Select topic" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-[#222] border-[#444]">
                                  <SelectItem value="movie-1" className="text-white hover:bg-[#333]">
                                    Back to the Future (1985)
                                  </SelectItem>
                                  <SelectItem value="movie-2" className="text-white hover:bg-[#333]">
                                    Back to the Future Part II
                                  </SelectItem>
                                  <SelectItem value="movie-3" className="text-white hover:bg-[#333]">
                                    Back to the Future Part III
                                  </SelectItem>
                                  <SelectItem value="characters" className="text-white hover:bg-[#333]">
                                    Characters
                                  </SelectItem>
                                  <SelectItem value="time-travel" className="text-white hover:bg-[#333]">
                                    Time Travel
                                  </SelectItem>
                                  <SelectItem value="vehicles" className="text-white hover:bg-[#333]">
                                    Vehicles
                                  </SelectItem>
                                  <SelectItem value="locations" className="text-white hover:bg-[#333]">
                                    Locations
                                  </SelectItem>
                                  <SelectItem value="behind-scenes" className="text-white hover:bg-[#333]">
                                    Behind the Scenes
                                  </SelectItem>
                                  <SelectItem value="trivia" className="text-white hover:bg-[#333]">
                                    General Trivia
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-gray-500">What aspect of Back to the Future does this cover?</FormDescription>
                              <FormMessage className="text-[#FF3D00]" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="pointValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Point Value</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" className="bg-[#222] border-[#444] text-white" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                              <FormDescription className="text-gray-500">Points awarded for correct answer</FormDescription>
                              <FormMessage className="text-[#FF3D00]" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="timeLimit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Time Limit (seconds)</FormLabel>
                              <FormControl>
                                <Input type="number" min="5" className="bg-[#222] border-[#444] text-white" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                              <FormDescription className="text-gray-500">Time allowed to answer the question</FormDescription>
                              <FormMessage className="text-[#FF3D00]" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="answers" className="space-y-6">
                    {questionType === "multiple-choice" && (
                      <div className="space-y-4">
                        <div className="bg-[#222] rounded-lg border border-[#333] p-4">
                          <h3 className="text-lg font-semibold mb-4 text-white">Answer Options</h3>
                          {form.watch("options")?.map((_, index) => (
                            <div key={index} className="flex gap-2 items-start mb-2">
                              <FormField
                                control={form.control}
                                name={`options.${index}`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input placeholder={`Option ${index + 1}`} {...field} className="bg-[#111] border-[#333] text-white" />
                                    </FormControl>
                                    <FormMessage className="text-[#FF3D00]" />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeOption(index)}
                                disabled={form.watch("options")?.length <= 2}
                                className="border-[#333] text-[#666] hover:text-white hover:border-[#FF3D00]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button type="button" variant="outline" onClick={addOption} className="mt-2 border-[#333] text-[#666] hover:text-white hover:border-[#FF3D00]">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Option
                          </Button>
                        </div>
                        <FormField
                          control={form.control}
                          name="correctAnswer"
                          render={({ field }) => (
                            <FormItem className="bg-[#222] rounded-lg border border-[#333] p-4">
                              <FormLabel className="text-white">Correct Answer</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger className="bg-[#111] border-[#333] text-white">
                                    <SelectValue placeholder="Select correct answer" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-[#222] border-[#333]">
                                  {form.watch("options")?.map((option, index) => (
                                    <SelectItem key={index} value={index.toString()} className="text-white hover:bg-[#333]">
                                      {option || `Option ${index + 1}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-[#666]">Select which option is the correct answer</FormDescription>
                              <FormMessage className="text-[#FF3D00]" />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                    {questionType === "true-false" && (
                      <div className="space-y-4">
                        <div className="bg-[#222] rounded-lg border border-[#333] p-4">
                          <h3 className="text-lg font-semibold mb-4 text-white">Answer Options</h3>
                          <div className="flex flex-col gap-2">
                            <Input value="True" disabled className="bg-[#111] border-[#333] text-white" />
                            <Input value="False" disabled className="bg-[#111] border-[#333] text-white" />
                          </div>
                        </div>
                        <FormField
                          control={form.control}
                          name="correctAnswer"
                          render={({ field }) => (
                            <FormItem className="bg-[#222] rounded-lg border border-[#333] p-4">
                              <FormLabel className="text-white">Correct Answer</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger className="bg-[#111] border-[#333] text-white">
                                    <SelectValue placeholder="Select correct answer" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-[#222] border-[#333]">
                                  <SelectItem value="0" className="text-white hover:bg-[#333]">
                                    True
                                  </SelectItem>
                                  <SelectItem value="1" className="text-white hover:bg-[#333]">
                                    False
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-[#666]">Select whether the correct answer is True or False</FormDescription>
                              <FormMessage className="text-[#FF3D00]" />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                    {questionType === "write-in" && (
                      <FormField
                        control={form.control}
                        name="correctAnswer"
                        render={({ field }) => (
                          <FormItem className="bg-[#222] rounded-lg border border-[#333] p-4">
                            <FormLabel className="text-white">Correct Answer</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter the correct answer" {...field} className="bg-[#111] border-[#333] text-white" />
                            </FormControl>
                            <FormDescription className="text-[#666]">Be specific but allow for variations in spelling and formatting</FormDescription>
                            <FormMessage className="text-[#FF3D00]" />
                          </FormItem>
                        )}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="media" className="space-y-6">
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem className="bg-[#222] rounded-lg border border-[#333] p-4">
                            <FormLabel className="text-white">Image URL</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter image URL" {...field} className="bg-[#111] border-[#333] text-white" />
                            </FormControl>
                            <FormDescription className="text-[#666]">Add an image to make your question more engaging</FormDescription>
                            {field.value && (
                              <div className="mt-2">
                                <img src={field.value} alt="Question preview" className="max-w-sm rounded-lg border border-[#333]" onError={() => setPreviewImage(null)} />
                              </div>
                            )}
                            <FormMessage className="text-[#FF3D00]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="videoUrl"
                        render={({ field }) => (
                          <FormItem className="bg-[#222] rounded-lg border border-[#333] p-4">
                            <FormLabel className="text-white">Video URL</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter video URL" {...field} className="bg-[#111] border-[#333] text-white" />
                            </FormControl>
                            <FormDescription className="text-[#666]">Add a video clip to enhance the question</FormDescription>
                            <FormMessage className="text-[#FF3D00]" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="hints" className="space-y-6">
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="hint"
                        render={({ field }) => (
                          <FormItem className="bg-[#222] rounded-lg border border-[#333] p-4">
                            <FormLabel className="text-white">Hint</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter a helpful hint" {...field} className="bg-[#111] border-[#333] text-white min-h-[100px]" />
                            </FormControl>
                            <FormDescription className="text-[#666]">A clue that can help players answer the question</FormDescription>
                            <FormMessage className="text-[#FF3D00]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hintPenalty"
                        render={({ field }) => (
                          <FormItem className="bg-[#222] rounded-lg border border-[#333] p-4">
                            <FormLabel className="text-white">Hint Penalty</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} className="bg-[#111] border-[#333] text-white" onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormDescription className="text-[#666]">Points deducted when a player uses the hint</FormDescription>
                            <FormMessage className="text-[#FF3D00]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="explanation"
                        render={({ field }) => (
                          <FormItem className="bg-[#222] rounded-lg border border-[#333] p-4">
                            <FormLabel className="text-white">Explanation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter explanation" {...field} className="bg-[#111] border-[#333] text-white min-h-[100px]" />
                            </FormControl>
                            <FormDescription className="text-[#666]">Detailed explanation of the correct answer</FormDescription>
                            <FormMessage className="text-[#FF3D00]" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-between p-6 border-t border-[#333] mt-6">
                  <Button type="button" variant="outline" onClick={() => navigate("/admin/questions")} className="border-[#444] text-gray-400 hover:text-white hover:border-[#FF3D00]">
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
                      <Button type="button" onClick={() => handleStepChange(currentStep + 1)} className="bg-gradient-to-r from-[#FF3D00] to-[#FFD700] text-white hover:opacity-90">
                        Next
                      </Button>
                    ) : (
                      <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-[#FF3D00] to-[#FFD700] text-white hover:opacity-90 disabled:opacity-50">
                        {isLoading ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            {questionId ? "Updating..." : "Creating..."}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {questionId ? "Update Question" : "Create Question"}
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
    </AdminLayout>
  );
};

export default QuestionForm;
