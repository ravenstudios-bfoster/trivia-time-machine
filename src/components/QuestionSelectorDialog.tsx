import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";
import { Question } from "@/types";
import { useQuestions } from "@/hooks/useQuestions";

interface QuestionSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (questions: Question[]) => void;
  selectedQuestions: Question[];
}

export default function QuestionSelectorDialog({ open, onOpenChange, onSelect, selectedQuestions }: QuestionSelectorDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { questions, isLoading } = useQuestions();

  const filteredQuestions = questions.filter((question) => !selectedQuestions.find((selected) => selected.id === question.id) && question.text.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSelectQuestion = (question: Question) => {
    onSelect([...selectedQuestions, question]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#1a1a1a] border-[#444]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#FF3D00]">Select Questions</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#222] border-[#444] text-white placeholder:text-gray-500"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-4 text-gray-400">Loading questions...</div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-4 text-gray-400">No questions found</div>
            ) : (
              filteredQuestions.map((question) => (
                <div key={question.id} className="flex items-center justify-between p-4 bg-[#222] rounded-lg border border-[#444] hover:border-[#FF3D00] transition-colors">
                  <div className="flex-1">
                    <p className="text-white">{question.text}</p>
                    <p className="text-sm text-gray-400">
                      Level {question.level} • {question.type} • {question.difficulty}
                    </p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => handleSelectQuestion(question)} className="ml-4 border-[#444] text-gray-400 hover:text-white hover:border-[#FF3D00]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
