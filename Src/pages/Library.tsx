import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Trash2, ChevronDown, ChevronRight, CheckCircle2, Circle, GraduationCap, ArrowLeft, BookMarked, Sparkles, ExternalLink, Play, FileText } from "lucide-react";
import { useSubjects } from "@/lib/firestore-store";
import type { Quiz, QuizQuestion } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import QuizModal from "@/components/QuizModal";
import { NEP_SEMESTERS, type NEPSemester, type NEPSubject, type NEPModule } from "@/lib/nep2020-data";
import SystemNotification from "@/components/SystemNotification";

const COLORS = ["#00f0ff", "#a855f7", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];

type View = "semesters" | "subjects" | "modules" | "study" | "custom";

export default function Library() {
  const { subjects, loaded: subjectsLoaded, addSubject, addModule, completeModule, saveQuiz, deleteSubject, deleteModule } = useSubjects();
  const [view, setView] = useState<View>("semesters");
  const [selectedSem, setSelectedSem] = useState<NEPSemester | null>(null);
  const [selectedNepSubject, setSelectedNepSubject] = useState<NEPSubject | null>(null);
  const [selectedNepModule, setSelectedNepModule] = useState<NEPModule | null>(null);
  const [masteryNotif, setMasteryNotif] = useState<{ show: boolean; moduleName: string } | null>(null);

  // Custom subject state
  const [newSubject, setNewSubject] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [addModuleFor, setAddModuleFor] = useState<string | null>(null);
  const [moduleName, setModuleName] = useState("");
  const [moduleDuration, setModuleDuration] = useState("1");
  const [moduleTopics, setModuleTopics] = useState("");
  const [quizModule, setQuizModule] = useState<{ subjectId: string; moduleId: string; moduleName: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Seed NEP subjects only after Firestore hydration to avoid overwriting persisted progress
  useEffect(() => {
    if (!subjectsLoaded) return;

    NEP_SEMESTERS.forEach(sem => {
      sem.subjects.forEach(nepSub => {
        const storeSubject = subjects.find(s => s.name === `[${sem.name}] ${nepSub.name}`);

        if (!storeSubject) {
          const created = addSubject(`[${sem.name}] ${nepSub.name}`, nepSub.color);
          nepSub.modules.forEach(mod => addModule(created.id, mod.name, mod.duration, mod.topics));
          return;
        }

        nepSub.modules.forEach(mod => {
          const moduleExists = storeSubject.modules.some(existing => existing.name === mod.name);
          if (!moduleExists) {
            addModule(storeSubject.id, mod.name, mod.duration, mod.topics);
          }
        });
      });
    });
  }, [subjectsLoaded, subjects, addSubject, addModule]);

  // Find the store subject matching a NEP subject
  const findStoreSubject = (semName: string, nepSubName: string) => {
    return subjects.find(s => s.name === `[${semName}] ${nepSubName}`);
  };

  const handleNepQuizSave = (subjectId: string, moduleId: string, quiz: Quiz) => {
    saveQuiz(subjectId, moduleId, quiz);
    // Check mastery
    if (quiz.score !== undefined && quiz.totalScore && quiz.totalScore > 0) {
      const pct = (quiz.score / quiz.totalScore) * 100;
      if (pct >= 75) {
        completeModule(subjectId, moduleId);
        setMasteryNotif({ show: true, moduleName: selectedNepModule?.name || "Module" });
      }
    }
  };

  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    addSubject(newSubject.trim(), selectedColor);
    setNewSubject("");
    setDialogOpen(false);
  };

  const handleAddModule = (subjectId: string) => {
    if (!moduleName.trim()) return;
    addModule(subjectId, moduleName.trim(), parseFloat(moduleDuration) || 1, moduleTopics.split(",").map(t => t.trim()).filter(Boolean));
    setModuleName("");
    setModuleDuration("1");
    setModuleTopics("");
    setAddModuleFor(null);
  };

  // NEP Quiz modal state
  const [nepQuizOpen, setNepQuizOpen] = useState(false);
  const [nepQuizData, setNepQuizData] = useState<{ subjectId: string; moduleId: string; moduleName: string } | null>(null);

  const openNepQuiz = (semName: string, nepSubName: string, nepMod: NEPModule) => {
    const storeSub = findStoreSubject(semName, nepSubName);
    if (!storeSub) return;
    const storeMod = storeSub.modules.find(m => m.name === nepMod.name);
    if (!storeMod) return;
    setNepQuizData({ subjectId: storeSub.id, moduleId: storeMod.id, moduleName: nepMod.name });
    setNepQuizOpen(true);
  };

  const getModuleStatus = (semName: string, nepSubName: string, modName: string) => {
    const storeSub = findStoreSubject(semName, nepSubName);
    if (!storeSub) return { completed: false, mastered: false, quiz: undefined as Quiz | undefined };
    const storeMod = storeSub.modules.find(m => m.name === modName);
    if (!storeMod) return { completed: false, mastered: false, quiz: undefined };
    const mastered = storeMod.quiz?.score !== undefined && storeMod.quiz?.totalScore
      ? ((storeMod.quiz.score / storeMod.quiz.totalScore) * 100) >= 75
      : false;
    return { completed: storeMod.completed, mastered, quiz: storeMod.quiz };
  };

  return (
    <div className="space-y-6">
      {/* Mastery notification */}
      {masteryNotif && (
        <SystemNotification
          show={masteryNotif.show}
          title="MODULE MASTERED"
          message={`Congratulations! You have mastered "${masteryNotif.moduleName}" with ≥75% score. Your progress has been updated.`}
          type="success"
          onClose={() => setMasteryNotif(null)}
        />
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view !== "semesters" && view !== "custom" && (
            <button
              onClick={() => {
                if (view === "study") { setView("modules"); setSelectedNepModule(null); }
                else if (view === "modules") { setView("subjects"); setSelectedNepSubject(null); }
                else if (view === "subjects") { setView("semesters"); setSelectedSem(null); }
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {view === "custom" && (
            <button onClick={() => setView("semesters")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-display font-bold neon-text">KNOWLEDGE LIBRARY</h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">
              {view === "semesters" && "NEP 2020 CURRICULUM"}
              {view === "subjects" && selectedSem?.name.toUpperCase()}
              {view === "modules" && selectedNepSubject?.name.toUpperCase()}
              {view === "study" && selectedNepModule?.name.toUpperCase()}
              {view === "custom" && "CUSTOM SUBJECTS"}
            </p>
          </div>
        </div>
        {view === "semesters" && (
          <Button onClick={() => setView("custom")} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
            <Plus className="w-4 h-4 mr-2" /> Custom Subjects
          </Button>
        )}
      </motion.div>

      {/* Semester Selection */}
      {view === "semesters" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NEP_SEMESTERS.map((sem, i) => {
            // Calculate semester progress
            let total = 0, mastered = 0;
            sem.subjects.forEach(sub => {
              sub.modules.forEach(mod => {
                total++;
                const status = getModuleStatus(sem.name, sub.name, mod.name);
                if (status.mastered) mastered++;
              });
            });
            return (
              <motion.button
                key={sem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => { setSelectedSem(sem); setView("subjects"); }}
                className="glass-panel p-6 text-left hover:border-primary/40 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <BookMarked className="w-8 h-8 text-primary group-hover:text-primary" />
                  <div>
                    <h2 className="font-display text-lg font-bold">{sem.name}</h2>
                    <p className="text-xs font-mono text-muted-foreground">{sem.subjects.length} SUBJECTS • {total} MODULES</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full xp-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${total > 0 ? (mastered / total) * 100 : 0}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
                <p className="text-[10px] font-mono text-muted-foreground mt-1">{mastered}/{total} MASTERED</p>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Subjects List */}
      {view === "subjects" && selectedSem && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedSem.subjects.map((sub, i) => {
            let total = sub.modules.length, mastered = 0;
            sub.modules.forEach(mod => {
              const status = getModuleStatus(selectedSem.name, sub.name, mod.name);
              if (status.mastered) mastered++;
            });
            return (
              <motion.button
                key={sub.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { setSelectedNepSubject(sub); setView("modules"); }}
                className="glass-panel p-5 text-left hover:border-primary/40 transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: sub.color }} />
                  <h3 className="font-display font-bold flex-1">{sub.name}</h3>
                </div>
                <p className="text-xs font-mono text-muted-foreground mb-2">6 MODULES • {mastered} MASTERED</p>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full xp-bar-fill" style={{ width: `${(mastered / total) * 100}%` }} />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Modules List */}
      {view === "modules" && selectedNepSubject && selectedSem && (
        <div className="space-y-3">
          {selectedNepSubject.modules.map((mod, i) => {
            const status = getModuleStatus(selectedSem.name, selectedNepSubject.name, mod.name);
            return (
              <motion.div
                key={mod.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`mission-item cursor-pointer ${status.mastered ? "mission-complete" : ""}`}
                onClick={() => { setSelectedNepModule(mod); setView("study"); }}
              >
                {status.mastered ? (
                  <Sparkles className="w-5 h-5 text-success flex-shrink-0" />
                ) : status.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{mod.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {mod.duration}H • {mod.topics.length} TOPICS
                    {status.quiz?.score !== undefined && ` • QUIZ: ${status.quiz.score}/${status.quiz.totalScore}`}
                    {status.mastered && " • ✦ MASTERED"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Module Study Page */}
      {view === "study" && selectedNepModule && selectedSem && selectedNepSubject && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {(() => {
            const status = getModuleStatus(selectedSem.name, selectedNepSubject.name, selectedNepModule.name);
            const storeSub = findStoreSubject(selectedSem.name, selectedNepSubject.name);
            const storeMod = storeSub?.modules.find(m => m.name === selectedNepModule.name);

            return (
              <>
                {/* Status badge */}
                {status.mastered && (
                  <div className="glass-panel-glow p-3 flex items-center gap-2 text-success">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-display text-sm font-bold">MODULE MASTERED</span>
                  </div>
                )}

                {/* Study content */}
                <div className="glass-panel p-6">
                  <h2 className="font-display text-lg font-bold mb-2 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    STUDY MATERIAL
                  </h2>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedNepModule.topics.map(t => (
                        <span key={t} className="text-[10px] font-mono px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{selectedNepModule.studyContent}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">ESTIMATED DURATION: {selectedNepModule.duration} HOURS</p>
                  </div>
                </div>

                {/* Study Resources */}
                {selectedNepModule.resources && selectedNepModule.resources.length > 0 && (
                  <div className="glass-panel p-6">
                    <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                      <ExternalLink className="w-5 h-5 text-accent" />
                      STUDY RESOURCES
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedNepModule.resources.map((res, idx) => (
                        <a
                          key={idx}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-panel p-4 flex items-start gap-3 hover:border-primary/40 transition-all group"
                        >
                          {res.type === "youtube" ? (
                            <Play className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                          ) : (
                            <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium group-hover:text-primary transition-colors">{res.title}</p>
                            <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase">
                              {res.type === "youtube" ? "📺 VIDEO LECTURE" : "📄 ARTICLE / DOCS"}
                            </p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  {!status.completed && storeSub && storeMod && (
                    <Button
                      onClick={() => {
                        completeModule(storeSub.id, storeMod.id);
                      }}
                      className="bg-success text-success-foreground hover:bg-success/90"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Completed
                    </Button>
                  )}
                  <Button
                    onClick={() => openNepQuiz(selectedSem.name, selectedNepSubject.name, selectedNepModule)}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <GraduationCap className="w-4 h-4 mr-2" /> Take Quiz
                  </Button>
                </div>

                {/* Quiz results */}
                {status.quiz?.score !== undefined && (
                  <div className="glass-panel p-4">
                    <p className="text-xs font-mono text-muted-foreground">
                      LAST QUIZ SCORE: <span className={status.mastered ? "text-success" : "text-destructive"}>
                        {status.quiz.score}/{status.quiz.totalScore} ({Math.round((status.quiz.score! / status.quiz.totalScore!) * 100)}%)
                      </span>
                      {status.mastered ? " — MASTERED ✦" : " — Score ≥75% needed for mastery"}
                    </p>
                  </div>
                )}
              </>
            );
          })()}
        </motion.div>
      )}

      {/* Custom Subjects View */}
      {view === "custom" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                  <Plus className="w-4 h-4 mr-2" /> Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel border-glass-border">
                <DialogHeader>
                  <DialogTitle className="font-display neon-text">NEW SUBJECT</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Subject name..." value={newSubject} onChange={e => setNewSubject(e.target.value)} className="bg-muted/50 border-glass-border" onKeyDown={e => e.key === "Enter" && handleAddSubject()} />
                  <div className="flex gap-2">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setSelectedColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <Button onClick={handleAddSubject} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Create Subject</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {subjects.filter(s => !s.name.startsWith("[Semester")).length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-display text-muted-foreground">NO CUSTOM SUBJECTS</p>
            </div>
          ) : (
            subjects.filter(s => !s.name.startsWith("[Semester")).map((subject, i) => (
              <motion.div key={subject.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-panel overflow-hidden">
                <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                  {expandedSubject === subject.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <h3 className="font-display font-bold flex-1">{subject.name}</h3>
                  <span className="text-xs font-mono text-muted-foreground">{subject.modules.filter(m => m.completed).length}/{subject.modules.length} COMPLETE</span>
                  <button onClick={e => { e.stopPropagation(); deleteSubject(subject.id); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
                <AnimatePresence>
                  {expandedSubject === subject.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-2">
                        {subject.modules.map(mod => (
                          <div key={mod.id} className="mission-item">
                            <button onClick={() => !mod.completed && completeModule(subject.id, mod.id)}>
                              {mod.completed ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                            </button>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${mod.completed ? "line-through text-muted-foreground" : ""}`}>{mod.name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">{mod.duration}H • {mod.topics.length} TOPICS{mod.quiz?.score !== undefined && ` • QUIZ: ${mod.quiz.score}/${mod.quiz.totalScore}`}</p>
                            </div>
                            <button onClick={() => setQuizModule({ subjectId: subject.id, moduleId: mod.id, moduleName: mod.name })} className="text-xs font-mono text-neon-purple hover:text-neon-purple/80 px-2 py-1 rounded bg-accent/10"><GraduationCap className="w-4 h-4" /></button>
                            <button onClick={() => deleteModule(subject.id, mod.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                        {addModuleFor === subject.id ? (
                          <div className="glass-panel p-3 space-y-2">
                            <Input placeholder="Module name" value={moduleName} onChange={e => setModuleName(e.target.value)} className="bg-muted/50 border-glass-border text-sm" />
                            <div className="flex gap-2">
                              <Input placeholder="Hours" type="number" value={moduleDuration} onChange={e => setModuleDuration(e.target.value)} className="bg-muted/50 border-glass-border text-sm w-20" />
                              <Input placeholder="Topics (comma-separated)" value={moduleTopics} onChange={e => setModuleTopics(e.target.value)} className="bg-muted/50 border-glass-border text-sm flex-1" />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleAddModule(subject.id)} className="bg-primary text-primary-foreground">Add</Button>
                              <Button size="sm" variant="ghost" onClick={() => setAddModuleFor(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setAddModuleFor(subject.id)} className="w-full p-2 border border-dashed border-glass-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">+ Add Module</button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* NEP Quiz Modal with predefined questions */}
      {nepQuizOpen && nepQuizData && selectedNepModule && (
        <NepQuizModal
          subjectId={nepQuizData.subjectId}
          moduleId={nepQuizData.moduleId}
          moduleName={nepQuizData.moduleName}
          questions={selectedNepModule.quizQuestions}
          onSave={handleNepQuizSave}
          onClose={() => { setNepQuizOpen(false); setNepQuizData(null); }}
        />
      )}

      {/* Custom Quiz Modal */}
      {quizModule && (
        <QuizModal subjectId={quizModule.subjectId} moduleId={quizModule.moduleId} moduleName={quizModule.moduleName} onSave={saveQuiz} onClose={() => setQuizModule(null)} />
      )}
    </div>
  );
}

// NEP Quiz Modal with predefined questions
function NepQuizModal({ subjectId, moduleId, moduleName, questions, onSave, onClose }: {
  subjectId: string;
  moduleId: string;
  moduleName: string;
  questions: { question: string; options: string[]; correctIndex: number }[];
  onSave: (subjectId: string, moduleId: string, quiz: Quiz) => void;
  onClose: () => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | undefined)[]>(new Array(questions.length).fill(undefined));
  const [mode, setMode] = useState<"take" | "results">("take");
  const [score, setScore] = useState(0);

  const answerQuestion = (idx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);

    if (currentQ + 1 < questions.length) {
      setCurrentQ(prev => prev + 1);
    } else {
      // Calculate score
      let s = 0;
      newAnswers.forEach((a, i) => { if (a === questions[i].correctIndex) s++; });
      setScore(s);
      setMode("results");
    }
  };

  const saveResults = () => {
    const quizQuestions: QuizQuestion[] = questions.map((q, i) => ({
      id: `nep-${i}`,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      userAnswer: answers[i],
    }));
    const quiz: Quiz = {
      id: Date.now().toString(36),
      moduleId,
      questions: quizQuestions,
      score,
      totalScore: questions.length,
      completedAt: new Date().toISOString(),
    };
    onSave(subjectId, moduleId, quiz);
    onClose();
  };

  const pct = Math.round((score / questions.length) * 100);
  const mastered = pct >= 75;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="glass-panel border-glass-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display neon-text flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            QUIZ: {moduleName.toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        {mode === "take" && (
          <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="flex justify-between text-xs font-mono text-muted-foreground">
              <span>QUESTION {currentQ + 1}/{questions.length}</span>
            </div>
            <p className="text-lg font-medium">{questions[currentQ].question}</p>
            <div className="space-y-2">
              {questions[currentQ].options.map((opt, i) => (
                <button key={i} onClick={() => answerQuestion(i)} className="w-full text-left glass-panel p-3 hover:border-primary/40 transition-colors text-sm">
                  <span className="font-mono text-primary mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {mode === "results" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
            <div className={`text-6xl font-display font-bold ${mastered ? "neon-text" : "text-destructive"}`}>{score}/{questions.length}</div>
            <p className="text-lg font-mono">{pct}%</p>
            <p className="font-mono text-muted-foreground">
              {mastered ? "✦ MODULE MASTERED! ✦" : "Score ≥75% needed. Try again!"}
            </p>
            <div className="space-y-1">
              {questions.map((q, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {answers[i] === q.correctIndex
                    ? <CheckCircle2 className="w-4 h-4 text-success" />
                    : <span className="w-4 h-4 rounded-full bg-destructive/20 text-destructive text-[10px] flex items-center justify-center">✕</span>
                  }
                  <span className="truncate text-left">{q.question}</span>
                </div>
              ))}
            </div>
            <Button onClick={saveResults} className="w-full bg-primary text-primary-foreground">SAVE RESULTS</Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}