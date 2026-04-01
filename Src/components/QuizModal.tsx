import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Quiz, QuizQuestion } from "@/lib/store";
import { GraduationCap, CheckCircle2, XCircle, Plus, Trash2 } from "lucide-react";

interface Props {
  subjectId: string;
  moduleId: string;
  moduleName: string;
  onSave: (subjectId: string, moduleId: string, quiz: Quiz) => void;
  onClose: () => void;
}

export default function QuizModal({ subjectId, moduleId, moduleName, onSave, onClose }: Props) {
  const [mode, setMode] = useState<"create" | "take" | "results">("create");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);

  // Create mode
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", "", "", ""]);
  const [correctIdx, setCorrectIdx] = useState(0);

  const addQuestion = () => {
    if (!newQuestion.trim() || newOptions.some(o => !o.trim())) return;
    setQuestions(prev => [...prev, {
      id: Date.now().toString(36),
      question: newQuestion.trim(),
      options: [...newOptions],
      correctIndex: correctIdx,
    }]);
    setNewQuestion("");
    setNewOptions(["", "", "", ""]);
    setCorrectIdx(0);
  };

  const startQuiz = () => {
    if (questions.length === 0) return;
    setMode("take");
    setCurrentQ(0);
    setScore(0);
  };

  const answerQuestion = (answerIdx: number) => {
    const q = questions[currentQ];
    const updated = [...questions];
    updated[currentQ] = { ...q, userAnswer: answerIdx };
    setQuestions(updated);

    if (answerIdx === q.correctIndex) setScore(prev => prev + 1);

    if (currentQ + 1 < questions.length) {
      setCurrentQ(prev => prev + 1);
    } else {
      setMode("results");
    }
  };

  const saveResults = () => {
    const quiz: Quiz = {
      id: Date.now().toString(36),
      moduleId,
      questions,
      score,
      totalScore: questions.length,
      completedAt: new Date().toISOString(),
    };
    onSave(subjectId, moduleId, quiz);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="glass-panel border-glass-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display neon-text flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            QUIZ: {moduleName.toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        {mode === "create" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Input placeholder="Question..." value={newQuestion} onChange={e => setNewQuestion(e.target.value)} className="bg-muted/50 border-glass-border" />
              {newOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    onClick={() => setCorrectIdx(i)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                      correctIdx === i ? "border-success bg-success/20 text-success" : "border-glass-border text-muted-foreground"
                    }`}
                  >
                    {correctIdx === i ? "✓" : String.fromCharCode(65 + i)}
                  </button>
                  <Input
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    value={opt}
                    onChange={e => { const n = [...newOptions]; n[i] = e.target.value; setNewOptions(n); }}
                    className="bg-muted/50 border-glass-border text-sm"
                  />
                </div>
              ))}
              <Button size="sm" onClick={addQuestion} className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-1" /> Add Question
              </Button>
            </div>

            {questions.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-mono text-muted-foreground">{questions.length} QUESTIONS ADDED</p>
                {questions.map((q, i) => (
                  <div key={q.id} className="flex items-center gap-2 text-sm glass-panel p-2">
                    <span className="font-mono text-primary text-xs">{i + 1}.</span>
                    <span className="flex-1 truncate">{q.question}</span>
                    <button onClick={() => setQuestions(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={startQuiz} disabled={questions.length === 0} className="w-full bg-accent text-accent-foreground">
              START QUIZ ({questions.length} Questions)
            </Button>
          </div>
        )}

        {mode === "take" && questions[currentQ] && (
          <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="flex justify-between text-xs font-mono text-muted-foreground">
              <span>QUESTION {currentQ + 1}/{questions.length}</span>
              <span>SCORE: {score}</span>
            </div>
            <p className="text-lg font-medium">{questions[currentQ].question}</p>
            <div className="space-y-2">
              {questions[currentQ].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => answerQuestion(i)}
                  className="w-full text-left glass-panel p-3 hover:border-primary/40 transition-colors text-sm"
                >
                  <span className="font-mono text-primary mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {mode === "results" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
            <div className="text-6xl font-display font-bold neon-text">{score}/{questions.length}</div>
            <p className="font-mono text-muted-foreground">
              {score === questions.length ? "PERFECT SCORE!" :
               score >= questions.length * 0.7 ? "WELL DONE!" :
               "KEEP PRACTICING!"}
            </p>
            <div className="space-y-1">
              {questions.map((q, i) => (
                <div key={q.id} className="flex items-center gap-2 text-sm">
                  {q.userAnswer === q.correctIndex ?
                    <CheckCircle2 className="w-4 h-4 text-success" /> :
                    <XCircle className="w-4 h-4 text-destructive" />
                  }
                  <span className="truncate">{q.question}</span>
                </div>
              ))}
            </div>
            <Button onClick={saveResults} className="w-full bg-primary text-primary-foreground">
              SAVE RESULTS
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}