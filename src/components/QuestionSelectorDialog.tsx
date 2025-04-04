import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Filter } from "lucide-react";
import { Question } from "@/types";
import { useQuestions } from "@/hooks/useQuestions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuestionSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (questions: Question[]) => void;
  selectedQuestions: Question[];
}

export default function QuestionSelectorDialog({ open, onOpenChange, onSelect, selectedQuestions }: QuestionSelectorDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [tempSelectedQuestions, setTempSelectedQuestions] = useState<Question[]>([]);
  const { questions, isLoading } = useQuestions();

  // Reset temp selections when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setTempSelectedQuestions([]);
    }
    onOpenChange(newOpen);
  };

  const filteredQuestions = questions.filter((question) => {
    const isNotAlreadySelected = !selectedQuestions.find((selected) => selected.id === question.id);
    const matchesSearch = question.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === "all" || !selectedLevel || question.level.toString() === selectedLevel;
    const matchesType = selectedType === "all" || !selectedType || question.type === selectedType;

    return isNotAlreadySelected && matchesSearch && matchesLevel && matchesType;
  });

  const handleCheckQuestion = (question: Question) => {
    setTempSelectedQuestions((prev) => {
      const isSelected = prev.find((q) => q.id === question.id);
      if (isSelected) {
        return prev.filter((q) => q.id !== question.id);
      } else {
        return [...prev, question];
      }
    });
  };

  const handleAddSelected = () => {
    onSelect([...selectedQuestions, ...tempSelectedQuestions]);
    onOpenChange(false);
  };

  const isQuestionSelected = (questionId: string) => {
    return tempSelectedQuestions.some((q) => q.id === questionId);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl bg-[#1a1a1a] border-[#444]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#FF3D00]">Select Questions</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#222] border-[#444] text-white placeholder:text-gray-500"
              />
            </div>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-[180px] bg-[#222] border-[#444] text-white">
                <SelectValue placeholder="Filter by Level" />
              </SelectTrigger>
              <SelectContent className="bg-[#222] border-[#444]">
                <SelectItem value="all" className="text-white hover:bg-[#333]">
                  All Levels
                </SelectItem>
                <SelectItem value="1" className="text-white hover:bg-[#333]">
                  Level 1
                </SelectItem>
                <SelectItem value="2" className="text-white hover:bg-[#333]">
                  Level 2
                </SelectItem>
                <SelectItem value="3" className="text-white hover:bg-[#333]">
                  Level 3
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px] bg-[#222] border-[#444] text-white">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent className="bg-[#222] border-[#444]">
                <SelectItem value="all" className="text-white hover:bg-[#333]">
                  All Types
                </SelectItem>
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
          </div>

          {/* Questions List */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-4 text-gray-400">Loading questions...</div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-4 text-gray-400">No questions found</div>
            ) : (
              filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className={`flex items-center p-4 bg-[#222] rounded-lg border transition-colors ${isQuestionSelected(question.id) ? "border-[#FF3D00]" : "border-[#444] hover:border-[#666]"}`}
                  onClick={() => handleCheckQuestion(question)}
                >
                  <Checkbox
                    checked={isQuestionSelected(question.id)}
                    onCheckedChange={() => handleCheckQuestion(question)}
                    className="mr-4 border-[#444] data-[state=checked]:bg-[#FF3D00] data-[state=checked]:border-[#FF3D00]"
                  />
                  <div className="flex-1">
                    <p className="text-white">{question.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-[#333] text-gray-300">
                        Level {question.level}
                      </Badge>
                      <Badge variant="outline" className="bg-[#333] text-gray-300">
                        {question.type}
                      </Badge>
                      <Badge variant="outline" className="bg-[#333] text-gray-300">
                        {question.difficulty}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-gray-400">
              {tempSelectedQuestions.length} question{tempSelectedQuestions.length !== 1 ? "s" : ""} selected
            </p>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#444] text-gray-400 hover:text-white hover:border-[#FF3D00]">
                Cancel
              </Button>
              <Button onClick={handleAddSelected} disabled={tempSelectedQuestions.length === 0} className="bg-[#FF3D00] text-white hover:opacity-90 disabled:opacity-50">
                <Plus className="h-4 w-4 mr-2" />
                Add Selected Questions
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
