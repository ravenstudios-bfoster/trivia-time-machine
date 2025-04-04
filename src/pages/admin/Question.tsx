import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getQuestionById, deleteQuestion } from "@/lib/firebase";
import { Question } from "@/types";
import { toast } from "sonner";
import { Edit, Trash2, ArrowLeft, Image, Video, Clock, Star, HelpCircle } from "lucide-react";

const AdminQuestion = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const loadQuestion = async () => {
      if (!questionId) return;

      try {
        setIsLoading(true);
        const questionData = await getQuestionById(questionId);
        if (!questionData) {
          toast.error("Question not found");
          navigate("/admin/questions");
          return;
        }
        setQuestion(questionData);
      } catch (error) {
        console.error("Error loading question:", error);
        toast.error("Failed to load question");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestion();
  }, [questionId, navigate]);

  const handleDelete = async () => {
    if (!questionId) return;

    try {
      setIsLoading(true);
      await deleteQuestion(questionId);
      toast.success("Question deleted successfully");
      navigate("/admin/questions");
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout
        title="Loading Question"
        subtitle="Please wait..."
        breadcrumbs={[
          { label: "Questions", href: "/admin/questions" },
          { label: "Question Details", href: `/admin/questions/${questionId}` },
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!question) {
    return (
      <AdminLayout
        title="Question Not Found"
        subtitle="The requested question could not be found"
        breadcrumbs={[
          { label: "Questions", href: "/admin/questions" },
          { label: "Question Details", href: `/admin/questions/${questionId}` },
        ]}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">This question may have been deleted or does not exist.</p>
              <Button variant="outline" onClick={() => navigate("/admin/questions")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Questions
              </Button>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Question Details"
      subtitle="View and manage question information"
      breadcrumbs={[
        { label: "Questions", href: "/admin/questions" },
        { label: "Question Details", href: `/admin/questions/${questionId}` },
      ]}
    >
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate("/admin/questions")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Questions
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => navigate(`/admin/questions/${questionId}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Question
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Question
            </Button>
          </div>
        </div>

        {/* Question Content */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Question Text</CardTitle>
                <CardDescription>
                  Level {question.level} - {question.difficulty}
                </CardDescription>
              </div>
              <Badge>{question.type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">{question.text}</p>

            {/* Question Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{question.timeLimit} seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span>{question.pointValue} points</span>
              </div>
            </div>

            {/* Topic */}
            <div className="mt-4">
              <h3 className="font-medium mb-2">Topic</h3>
              <Badge variant="outline">{question.topic}</Badge>
            </div>

            {/* Answer Options */}
            {(question.type === "multiple-choice" || question.type === "true-false") && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Answer Options</h3>
                <div className="space-y-2">
                  {question.options?.map((option, index) => (
                    <div key={index} className={`p-3 rounded-md border ${index === question.correctAnswer ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-border"}`}>
                      {option}
                      {index === question.correctAnswer && <Badge className="ml-2 bg-green-500">Correct Answer</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Write-in Answer */}
            {question.type === "write-in" && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Correct Answer</h3>
                <div className="p-3 rounded-md border border-green-500 bg-green-50 dark:bg-green-950">{question.correctAnswer}</div>
              </div>
            )}

            {/* Media */}
            {(question.imageUrl || question.videoUrl) && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Media</h3>
                <div className="space-y-2">
                  {question.imageUrl && (
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-muted-foreground" />
                      <a href={question.imageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        View Image
                      </a>
                    </div>
                  )}
                  {question.videoUrl && (
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <a href={question.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        View Video
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Hint */}
            {question.hint && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Hint</h3>
                <div className="flex items-start gap-2 p-3 rounded-md border border-border">
                  <HelpCircle className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p>{question.hint}</p>
                    <p className="text-sm text-muted-foreground mt-1">Penalty: {question.hintPenalty} points</p>
                  </div>
                </div>
              </div>
            )}

            {/* Explanation */}
            {question.explanation && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Explanation</h3>
                <p className="text-muted-foreground">{question.explanation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this question? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminQuestion;
