import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PlayerStats from "@/components/PlayerStats";
import ProgressPanel from "@/components/ProgressPanel";
import MissionList from "@/components/MissionList";
import SystemNotification from "@/components/SystemNotification";
import { useSubjects, useTasks, useWorkouts, useTargets, useStats, calculateProgress, calculateWorkoutProgress } from "@/lib/firestore-store";
import { useAuth } from "@/lib/auth-context";
import { Bot, Target, AlertTriangle, Dumbbell, BookOpen } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { subjects } = useSubjects();
  const { tasks, todayTasks, completeTask } = useTasks();
  const { workouts, todayWorkouts } = useWorkouts();
  const { missedTargets, activeTargets } = useTargets();
  const stats = useStats(tasks, subjects);
  const progress = calculateProgress(tasks, subjects);
  const workoutProgress = calculateWorkoutProgress(workouts);
  const [notification, setNotification] = useState<{ show: boolean; title: string; message: string } | null>(null);

  // Check for missed targets
  useEffect(() => {
    if (missedTargets.length > 0 && !missedTargets[0].penaltyAssigned) {
      setNotification({
        show: true,
        title: "MISSION FAILED",
        message: `You did not complete "${missedTargets[0].title}" within the specified time. A penalty task has been assigned.`,
      });
    }
  }, [missedTargets]);

  const suggestions = generateSuggestions(tasks, subjects, stats);
  const displayName = user?.displayName || "Agent";

  return (
    <div className="space-y-6">
      {notification && (
        <SystemNotification show={notification.show} title={notification.title} message={notification.message} onClose={() => setNotification(null)} />
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold neon-text">Welcome, {displayName}</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="font-mono text-xs text-muted-foreground glass-panel px-3 py-1.5">
          STATUS: <span className="text-success">ONLINE</span>
        </div>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Player + Progress */}
        <div className="space-y-6">
          <PlayerStats stats={stats} userName={displayName} />
          <ProgressPanel {...progress} />

          {/* Study & Workout Progress Bars */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-muted-foreground">PROGRESS BREAKDOWN</h3>

            {/* Study Progress */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Study (Modules Mastered)</span>
                <span className="ml-auto text-xs font-mono text-primary">{progress.masteredModules}/{progress.totalModules}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--primary)))" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.totalModules > 0 ? (progress.masteredModules / progress.totalModules) * 100 : 0}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>

            {/* Workout Progress */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Dumbbell className="w-4 h-4 text-accent" />
                <span className="text-xs text-muted-foreground">Workout Completion</span>
                <span className="ml-auto text-xs font-mono text-accent">{workoutProgress.completed}/{workoutProgress.total}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(var(--neon-purple)), hsl(var(--accent)))" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${workoutProgress.percentage}%` }}
                  transition={{ duration: 1, delay: 0.7 }}
                />
              </div>
            </div>

            {/* Overall */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">Overall ProgressAccuracy</span>
                <span className="ml-auto text-xs font-mono neon-text">{progress.progressAccuracy}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full xp-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progressAccuracy}%` }}
                  transition={{ duration: 1.2, delay: 0.9 }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Center: Missions */}
        <div className="space-y-6">
          <MissionList tasks={todayTasks} onComplete={completeTask} />

          {todayWorkouts.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-5">
              <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
                <span className="text-neon-purple">⚡</span> WORKOUT QUESTS
              </h3>
              {todayWorkouts.map(w => (
                <div key={w.id} className="mission-item mb-2">
                  <span className={`text-sm ${w.completed ? "line-through text-muted-foreground" : ""}`}>{w.name}</span>
                  <span className="ml-auto text-[10px] font-mono text-muted-foreground">{w.duration}MIN</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Right: Targets + AI */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-warning" />
              <h3 className="font-display text-lg font-bold">ACTIVE TARGETS</h3>
            </div>
            {activeTargets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 font-mono">NO ACTIVE TARGETS</p>
            ) : (
              <div className="space-y-2">
                {activeTargets.slice(0, 3).map(t => (
                  <div key={t.id} className="glass-panel p-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate">{t.title}</span>
                      <span className="font-mono text-xs text-primary">{t.tasksCompleted}/{t.tasksRequired}</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(t.tasksCompleted / t.tasksRequired) * 100}%` }} />
                    </div>
                    <p className="text-[9px] font-mono text-muted-foreground mt-1">DEADLINE: {new Date(t.deadline).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}

            {missedTargets.length > 0 && (
              <div className="mt-3 p-3 border border-destructive/30 rounded-lg bg-destructive/5">
                <div className="flex items-center gap-2 text-destructive text-xs font-mono">
                  <AlertTriangle className="w-4 h-4" />
                  {missedTargets.length} MISSED TARGET{missedTargets.length > 1 ? "S" : ""}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel-purple p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-neon-purple" />
              <h3 className="font-display text-lg font-bold">AI ADVISOR</h3>
            </div>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className="glass-panel p-3 text-xs text-muted-foreground">
                  <span className="text-neon-purple font-mono mr-1">▸</span> {s}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function generateSuggestions(tasks: any[], subjects: any[], stats: any): string[] {
  const suggestions: string[] = [];
  const pending = tasks.filter((t: any) => t.status === "pending");
  const completed = tasks.filter((t: any) => t.status === "completed");

  if (pending.length > 5) suggestions.push("You have many pending tasks. Consider prioritizing the most important ones first.");
  if (stats.streak > 3) suggestions.push(`Great ${stats.streak}-day streak! Keep the momentum going.`);
  if (stats.streak === 0) suggestions.push("Start a new streak today! Complete at least one task.");
  if (subjects.length === 0) suggestions.push("Add subjects to your library to start organized learning.");
  if (completed.length > 0 && pending.length === 0) suggestions.push("All missions complete! Consider adding new study goals.");
  if (suggestions.length === 0) suggestions.push("System analyzing your patterns. Complete more tasks for personalized advice.");

  return suggestions.slice(0, 4);
}
