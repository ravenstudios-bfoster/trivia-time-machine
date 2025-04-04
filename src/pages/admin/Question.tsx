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
          <Button variant="outline" onClick={() => navigate("/admin/questions")} className="border-[#444] text-gray-400 hover:text-white hover:border-[#FF3D00]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Questions
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => navigate(`/admin/questions/${questionId}/edit`)} className="border-[#444] text-gray-400 hover:text-white hover:border-[#FF3D00]">
              <Edit className="h-4 w-4 mr-2" />
              Edit Question
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="bg-[#FF3D00] hover:opacity-90">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Question
            </Button>
          </div>
        </div>

        {/* Question Content */}
        <Card className="border-t-4 border-t-[#FF3D00] bg-[#1a1a1a] shadow-xl">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-[#FF3D00]">Question Text</CardTitle>
                <CardDescription className="text-gray-400">
                  Level {question.level} - {question.difficulty}
                </CardDescription>
              </div>
              <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FF3D00] text-white">{question.type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-white">{question.text}</p>

            {/* Question Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#666]" />
                <span className="text-white">{question.timeLimit} seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[#666]" />
                <span className="text-white">{question.pointValue} points</span>
              </div>
            </div>

            {/* Topic */}
            <div className="mt-4">
              <h3 className="font-medium mb-2 text-white">Topic</h3>
              <Badge variant="outline" className="border-[#333] text-[#666] bg-[#222]">
                {question.topic}
              </Badge>
            </div>

            {/* Answer Options */}
            {(question.type === "multiple-choice" || question.type === "true-false") && (
              <div className="mt-4">
                <h3 className="font-medium mb-2 text-white">Answer Options</h3>
                <div className="space-y-2">
                  {question.options?.map((option, index) => (
                    <div key={index} className={`p-3 rounded-md border ${index === question.correctAnswer ? "border-[#FF3D00] bg-[#222]" : "border-[#333] bg-[#222]"}`}>
                      <span className="text-white">{option}</span>
                      {index === question.correctAnswer && <Badge className="ml-2 bg-gradient-to-r from-[#FFD700] to-[#FF3D00] text-white">Correct Answer</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Write-in Answer */}
            {question.type === "write-in" && (
              <div className="mt-4">
                <h3 className="font-medium mb-2 text-white">Correct Answer</h3>
                <div className="p-3 rounded-md border border-[#FF3D00] bg-[#222] text-white">{question.correctAnswer}</div>
              </div>
            )}

            {/* Media */}
            {(question.imageUrl || question.videoUrl) && (
              <div className="mt-4">
                <h3 className="font-medium mb-2 text-white">Media</h3>
                <div className="space-y-2">
                  {question.imageUrl && (
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-[#666]" />
                      <a href={question.imageUrl} target="_blank" rel="noopener noreferrer" className="text-[#FF3D00] hover:text-[#FFD700]">
                        View Image
                      </a>
                    </div>
                  )}
                  {question.videoUrl && (
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-[#666]" />
                      <a href={question.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[#FF3D00] hover:text-[#FFD700]">
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
                <h3 className="font-medium mb-2 text-white">Hint</h3>
                <div className="flex items-start gap-2 p-3 rounded-md border border-[#333] bg-[#222]">
                  <HelpCircle className="h-4 w-4 text-[#FF3D00] mt-1" />
                  <div>
                    <p className="text-white">{question.hint}</p>
                    <p className="text-sm text-[#666] mt-1">Penalty: {question.hintPenalty} points</p>
                  </div>
                </div>
              </div>
            )}

            {/* Explanation */}
            {question.explanation && (
              <div className="mt-4">
                <h3 className="font-medium mb-2 text-white">Explanation</h3>
                <p className="text-[#666]">{question.explanation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#1a1a1a] border border-[#333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Question</AlertDialogTitle>
            <AlertDialogDescription className="text-[#666]">Are you sure you want to delete this question? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#444] text-gray-400 hover:text-white hover:border-[#FF3D00] bg-transparent">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-[#FF3D00] text-white hover:opacity-90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminQuestion;
