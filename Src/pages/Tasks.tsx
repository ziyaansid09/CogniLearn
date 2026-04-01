import { useState } from "react";
import { motion } from "framer-motion";
import { ListTodo, Plus, CheckCircle2, Circle, AlertTriangle, Trash2, Filter } from "lucide-react";
import { useTasks } from "@/lib/firestore-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Tasks() {
  const { tasks, addTask, completeTask, missTask, deleteTask } = useTasks();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"study" | "workout" | "penalty">("study");
  const [duration, setDuration] = useState("30");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "missed">("all");

  const handleAdd = () => {
    if (!title.trim()) return;
    addTask({ title: title.trim(), type, status: "pending", date, duration: parseInt(duration) || 30 });
    setTitle("");
    setShowAdd(false);
  };

  const filtered = tasks
    .filter(t => filter === "all" || t.status === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingCount = tasks.filter(t => t.status === "pending").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold neon-text">MISSION LOG</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {pendingCount} PENDING • {completedCount} COMPLETED
          </p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
          <Plus className="w-4 h-4 mr-2" /> New Mission
        </Button>
      </motion.div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-panel p-4 space-y-3">
          <Input placeholder="Mission title..." value={title} onChange={e => setTitle(e.target.value)} className="bg-muted/50 border-glass-border" />
          <div className="flex gap-2">
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger className="w-32 bg-muted/50 border-glass-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="study">Study</SelectItem>
                <SelectItem value="workout">Workout</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Duration (min)" value={duration} onChange={e => setDuration(e.target.value)} className="w-32 bg-muted/50 border-glass-border" />
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-muted/50 border-glass-border" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} className="bg-primary text-primary-foreground">Create</Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "pending", "completed", "missed"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg transition-colors ${
              filter === f ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground bg-muted/30"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tasks */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <ListTodo className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-mono text-muted-foreground text-sm">NO MISSIONS FOUND</p>
          </div>
        ) : (
          filtered.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`mission-item ${
                task.status === "completed" ? "mission-complete opacity-60" :
                task.status === "missed" ? "mission-failed" :
                task.isPenalty ? "border-warning/40" : ""
              }`}
            >
              <button onClick={() => task.status === "pending" && completeTask(task.id)}>
                {task.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-success" /> :
                 task.status === "missed" ? <AlertTriangle className="w-5 h-5 text-destructive" /> :
                 <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />}
              </button>
              <div className="flex-1">
                <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                  {task.isPenalty && "⚠ "}{task.title}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {task.type.toUpperCase()} • {task.duration}MIN • {task.date}
                </p>
              </div>
              {task.status === "pending" && (
                <button onClick={() => missTask(task.id)} className="text-[9px] font-mono text-muted-foreground hover:text-destructive">MISS</button>
              )}
              <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}