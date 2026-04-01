import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Plus, Trash2, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useTargets, useTasks } from "@/lib/firestore-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SystemNotification from "@/components/SystemNotification";

export default function Targets() {
  const { targets, activeTargets, missedTargets, addTarget, updateTargetProgress, assignPenalty, deleteTarget } = useTargets();
  const { addTask } = useTasks();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"daily" | "weekly">("daily");
  const [category, setCategory] = useState<"study" | "workout" | "mixed">("study");
  const [tasksRequired, setTasksRequired] = useState("3");
  const [deadline, setDeadline] = useState("");
  const [notification, setNotification] = useState<{ show: boolean; title: string; message: string } | null>(null);

  const handleAdd = () => {
    if (!title.trim() || !deadline) return;
    addTarget({
      title: title.trim(), type, category, deadline,
      tasksRequired: parseInt(tasksRequired) || 3, tasksCompleted: 0,
    });
    setTitle("");
    setDeadline("");
    setShowAdd(false);
  };

  const handleAssignPenalty = (target: any) => {
    assignPenalty(target.id);
    addTask({
      title: `⚠ PENALTY: ${target.title}`,
      type: target.category === "workout" ? "workout" : "study",
      status: "pending",
      date: new Date().toISOString().split("T")[0],
      duration: 60,
      isPenalty: true,
    });
    setNotification({
      show: true,
      title: "NEW PENALTY QUEST ASSIGNED",
      message: `You did not complete "${target.title}" within the specified time. A penalty task has been assigned. Complete it before proceeding with new tasks.`,
    });
  };

  const completedTargets = targets.filter(t => t.completed);

  return (
    <div className="space-y-6">
      {notification && (
        <SystemNotification show={notification.show} title={notification.title} message={notification.message} onClose={() => setNotification(null)} />
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold neon-text">TARGET SYSTEM</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {activeTargets.length} ACTIVE • {missedTargets.length} MISSED • {completedTargets.length} COMPLETED
          </p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
          <Plus className="w-4 h-4 mr-2" /> Set Target
        </Button>
      </motion.div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-panel p-4 space-y-3">
          <Input placeholder="Target title..." value={title} onChange={e => setTitle(e.target.value)} className="bg-muted/50 border-glass-border" />
          <div className="flex gap-2 flex-wrap">
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger className="w-28 bg-muted/50 border-glass-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v: any) => setCategory(v)}>
              <SelectTrigger className="w-28 bg-muted/50 border-glass-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="study">Study</SelectItem>
                <SelectItem value="workout">Workout</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Tasks needed" value={tasksRequired} onChange={e => setTasksRequired(e.target.value)} className="w-32 bg-muted/50 border-glass-border" />
            <Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="bg-muted/50 border-glass-border" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} className="bg-primary text-primary-foreground">Set Target</Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {/* Missed targets - urgent */}
      {missedTargets.filter(t => !t.penaltyAssigned).length > 0 && (
        <div>
          <h2 className="font-display text-sm font-bold text-destructive mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> FAILED TARGETS
          </h2>
          <div className="space-y-2">
            {missedTargets.filter(t => !t.penaltyAssigned).map(t => (
              <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="system-notification flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-display text-sm font-bold">{t.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {t.tasksCompleted}/{t.tasksRequired} TASKS • DEADLINE: {new Date(t.deadline).toLocaleString()}
                  </p>
                </div>
                <Button size="sm" onClick={() => handleAssignPenalty(t)} className="bg-destructive text-destructive-foreground text-xs">
                  ASSIGN PENALTY
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Active targets */}
      <div>
        <h2 className="font-display text-sm font-bold text-muted-foreground mb-3">ACTIVE TARGETS</h2>
        {activeTargets.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-mono text-muted-foreground text-sm">NO ACTIVE TARGETS</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeTargets.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-panel p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-sm">{t.title}</h3>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      {t.type.toUpperCase()} • {t.category.toUpperCase()}
                    </p>
                  </div>
                  <button onClick={() => deleteTarget(t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>

                <div className="flex justify-between text-xs mb-1">
                  <span className="font-mono text-primary">{t.tasksCompleted}/{t.tasksRequired}</span>
                  <span className="font-mono text-muted-foreground">{Math.round((t.tasksCompleted / t.tasksRequired) * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(t.tasksCompleted / t.tasksRequired) * 100}%` }} />
                </div>

                <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  DEADLINE: {new Date(t.deadline).toLocaleString()}
                </div>

                {/* Quick update */}
                <div className="flex gap-1 mt-2">
                  <Button size="sm" variant="ghost" className="text-xs h-7"
                    onClick={() => updateTargetProgress(t.id, Math.max(0, t.tasksCompleted - 1))}>-</Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7"
                    onClick={() => updateTargetProgress(t.id, t.tasksCompleted + 1)}>+</Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      {completedTargets.length > 0 && (
        <div>
          <h2 className="font-display text-sm font-bold text-muted-foreground mb-3">COMPLETED</h2>
          <div className="space-y-2">
            {completedTargets.map(t => (
              <div key={t.id} className="mission-item mission-complete opacity-50">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <div className="flex-1">
                  <p className="text-sm line-through text-muted-foreground">{t.title}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{t.tasksCompleted}/{t.tasksRequired} TASKS</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}