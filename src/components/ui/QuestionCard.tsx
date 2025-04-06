import { useEffect, useState } from "react";
import { Question, AnswerOption } from "@/types";
import { Lightbulb, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import GameButton from "@/components/ui/GameButton";
import { TimerCircuit } from "@/components/ui/TimeCircuit";
import { createTimer } from "@/lib/gameLogic";

interface QuestionCardProps {
  question: Question;
  onSubmit: (selectedOptionId?: string, writtenAnswer?: string, timeRemaining?: number, usedHint?: boolean) => void;
}

const QuestionCard = ({ question, onSubmit }: QuestionCardProps) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [writtenAnswer, setWrittenAnswer] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(question.timeLimit);
  const [usedHint, setUsedHint] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOptionId("");
    setWrittenAnswer("");
    setTimeRemaining(question.timeLimit);
    setUsedHint(false);
    setShowHint(false);
    setIsAnswered(false);
  }, [question]);

  // Set up timer
  useEffect(() => {
    if (isAnswered) return;

    const timer = createTimer(
      question.timeLimit,
      (time) => setTimeRemaining(time),
      () => handleSubmit(true)
    );

    timer.start();

    return () => timer.stop();
  }, [question, isAnswered]);

  const handleShowHint = () => {
    setUsedHint(true);
    setShowHint(true);
  };

  const handleSubmit = (isTimeout: boolean = false) => {
    if (isAnswered) return;

    setIsAnswered(true);

    // Call onSubmit with appropriate values
    if (question.type === "write-in") {
      onSubmit(undefined, writtenAnswer, timeRemaining, usedHint);
    } else {
      onSubmit(selectedOptionId, undefined, timeRemaining, usedHint);
    }
  };

  const renderOptions = () => {
    if (question.type === "write-in") {
      return (
        <div className="mt-6" key="write-in-input">
          <Label htmlFor="answer" className="text-lg mb-2 block">
            Your Answer:
          </Label>
          <Input
            id="answer"
            type="text"
            placeholder="Type your answer here..."
            value={writtenAnswer}
            onChange={(e) => setWrittenAnswer(e.target.value)}
            disabled={isAnswered}
            className="text-lg p-4 bg-black/30 border-bttf-silver focus:border-bttf-blue"
          />
        </div>
      );
    }

    // Transform string options into AnswerOption objects
    const options: AnswerOption[] = (question.options || []).map((text, index) => ({
      id: `option-${index}`,
      text,
      isCorrect: index === question.correctAnswer,
    }));

    return (
      <RadioGroup value={selectedOptionId} onValueChange={setSelectedOptionId} className="mt-6 space-y-4" disabled={isAnswered}>
        {options.map((option) => (
          <div key={`option-${option.id}`} className="flex items-center space-x-3">
            <RadioGroupItem id={`radio-${option.id}`} value={option.id} className="border-2 border-bttf-silver focus:border-bttf-blue" />
            <Label htmlFor={`radio-${option.id}`} className="text-lg cursor-pointer hover:text-bttf-blue transition-colors">
              {option.text}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  };

  const renderHintButton = () => {
    if (!usedHint && !isAnswered && question.hint) {
      return (
        <GameButton key="hint-button" variant="secondary" size="sm" onClick={handleShowHint} className="inline-flex items-center gap-2">
          <HelpCircle size={16} />
          Use Hint
        </GameButton>
      );
    }

    if (usedHint && !showHint) {
      return (
        <GameButton key="show-hint-button" variant="secondary" size="sm" onClick={() => setShowHint(true)}>
          Show Hint
        </GameButton>
      );
    }

    if (!usedHint && !question.hint) {
      return <div key="empty-hint-space" />;
    }

    return null;
  };

  return (
    <Card className="flux-container w-full max-w-3xl animate-fade-in p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="badge bg-bttf-blue text-white px-3 py-1.5 rounded-md text-sm font-bold">Level {question.level}</span>
          <span className="text-bttf-yellow text-lg font-bold">{question.pointValue} pts</span>
        </div>
        <TimerCircuit timeInSeconds={timeRemaining} isRunning={!isAnswered} />
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold">{question.text}</h3>

        {question.imageUrl && (
          <div className="rounded-md overflow-hidden">
            <img src={question.imageUrl} alt="Question visual" className="w-full h-auto object-cover" />
          </div>
        )}

        {renderOptions()}
      </div>

      {showHint && (
        <div className="p-4 bg-bttf-yellow/20 rounded-md border border-bttf-yellow">
          <div className="flex items-start">
            <Lightbulb className="text-bttf-yellow mr-3 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-bttf-yellow mb-1">Hint:</h4>
              <p>{question.hint}</p>
              <p className="text-sm mt-2 text-red-400">-{question.hintPenalty} point penalty applied</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-2">
        {renderHintButton()}

        <GameButton onClick={() => handleSubmit(false)} disabled={isAnswered || (question.type !== "write-in" && !selectedOptionId) || (question.type === "write-in" && !writtenAnswer.trim())}>
          Submit Answer
        </GameButton>
      </div>
    </Card>
  );
};

export default QuestionCard;
