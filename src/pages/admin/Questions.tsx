import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { getQuestions, deleteQuestion } from "@/lib/firebase";
import { Question, QuestionType, Level } from "@/types";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Image, Video, Filter } from "lucide-react";
import { toast } from "sonner";

const AdminQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<Level | "all">("all");
  const [typeFilter, setTypeFilter] = useState<QuestionType | "all">("all");
  const [mediaFilter, setMediaFilter] = useState<"all" | "with-media" | "no-media">("all");
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const questionsData = await getQuestions();
        setQuestions(questionsData as Question[]);
        setFilteredQuestions(questionsData as Question[]);
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast.error("Failed to load questions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    let result = [...questions];

    // Apply level filter
    if (levelFilter !== "all") {
      result = result.filter((question) => question.level === levelFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      result = result.filter((question) => question.type === typeFilter);
    }

    // Apply media filter
    if (mediaFilter === "with-media") {
      result = result.filter((question) => question.imageUrl || question.videoUrl);
    } else if (mediaFilter === "no-media") {
      result = result.filter((question) => !question.imageUrl && !question.videoUrl);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((question) => question.text.toLowerCase().includes(term));
    }

    // Sort by creation date (newest first) if available, otherwise by ID
    result.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
      return a.id.localeCompare(b.id);
    });

    setFilteredQuestions(result);
  }, [questions, searchTerm, levelFilter, typeFilter, mediaFilter]);

  const handleDeleteQuestion = async () => {
    if (!deleteQuestionId) return;

    try {
      await deleteQuestion(deleteQuestionId);
      setQuestions(questions.filter((question) => question.id !== deleteQuestionId));
      toast.success("Question deleted successfully");
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    } finally {
      setDeleteQuestionId(null);
    }
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case "multiple-choice":
        return "Multiple Choice";
      case "true-false":
        return "True/False";
      case "write-in":
        return "Write-in";
      default:
        return type;
    }
  };

  const hasMedia = (question: Question) => {
    return !!(question.imageUrl || question.videoUrl);
  };

  return (
    <AdminLayout title="Questions Management" subtitle="Create and manage your trivia questions" breadcrumbs={[{ label: "Questions", href: "/admin/questions" }]}>
      {/* Filters and Actions */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search questions..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>

            <Link to="/admin/questions/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </Link>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-4 border rounded-md bg-muted/20">
            <div>
              <label className="text-sm font-medium mb-1 block">Level</label>
              <Select value={levelFilter.toString()} onValueChange={(value) => setLevelFilter(value === "all" ? "all" : (parseInt(value) as Level))}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Question Type</label>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as QuestionType | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                  <SelectItem value="true-false">True/False</SelectItem>
                  <SelectItem value="write-in">Write-in</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Media</label>
              <Select value={mediaFilter} onValueChange={(value) => setMediaFilter(value as "all" | "with-media" | "no-media")}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by media" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Questions</SelectItem>
                  <SelectItem value="with-media">With Media</SelectItem>
                  <SelectItem value="no-media">No Media</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Questions Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredQuestions.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Question</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Points</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell className="font-medium">
                    <div className="truncate max-w-md" title={question.text}>
                      {question.text}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Level {question.level}</Badge>
                  </TableCell>
                  <TableCell>{getQuestionTypeLabel(question.type)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {question.imageUrl && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Image className="h-3 w-3" />
                          Image
                        </Badge>
                      )}
                      {question.videoUrl && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          Video
                        </Badge>
                      )}
                      {!hasMedia(question) && <span className="text-muted-foreground text-sm">None</span>}
                    </div>
                  </TableCell>
                  <TableCell>{question.pointValue}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link to={`/admin/questions/${question.id}`}>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Question
                          </DropdownMenuItem>
                        </Link>

                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteQuestionId(question.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-12 border rounded-md">
          <h3 className="text-lg font-medium mb-2">No questions found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || levelFilter !== "all" || typeFilter !== "all" || mediaFilter !== "all" ? "Try adjusting your filters" : "Create your first question to get started"}
          </p>
          <Link to="/admin/questions/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </Link>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteQuestionId} onOpenChange={() => setDeleteQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this question. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteQuestion}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminQuestions;
