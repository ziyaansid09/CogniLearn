import { motion } from "framer-motion";
import { CheckCircle2, Circle, AlertTriangle, Swords } from "lucide-react";
import type { Task } from "@/lib/store";

interface Props {
  tasks: Task[];
  onComplete: (id: string) => void;
  title?: string;
}

export default function MissionList({ tasks, onComplete, title = "DAILY MISSIONS" }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-panel p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Swords className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg font-bold">{title}</h3>
        <span className="ml-auto text-xs font-mono text-muted-foreground">
          {tasks.filter(t => t.status === "completed").length}/{tasks.length}
        </span>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 font-mono">NO ACTIVE MISSIONS</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              className={`mission-item cursor-pointer ${
                task.status === "completed" ? "mission-complete opacity-60" :
                task.status === "missed" ? "mission-failed" :
                task.isPenalty ? "border-warning/40" : ""
              }`}
              onClick={() => task.status === "pending" && onComplete(task.id)}
            >
              {task.status === "completed" ? (
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              ) : task.status === "missed" ? (
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                  {task.isPenalty && <span className="text-warning mr-1">⚠</span>}
                  {task.title}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {task.type.toUpperCase()} • {task.duration}MIN
                </p>
              </div>

              {task.isPenalty && (
                <span className="text-[9px] font-mono text-warning bg-warning/10 px-2 py-0.5 rounded">
                  PENALTY
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}