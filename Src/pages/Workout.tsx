import { useState } from "react";
import { motion } from "framer-motion";
import { Dumbbell, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { useWorkouts } from "@/lib/firestore-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WORKOUT_TYPES = ["Cardio", "Strength", "Flexibility", "HIIT", "Yoga", "Running", "Swimming", "Custom"];

export default function Workout() {
  const { workouts, todayWorkouts, addWorkout, completeWorkout, deleteWorkout } = useWorkouts();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [wType, setWType] = useState("Cardio");
  const [duration, setDuration] = useState("30");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleAdd = () => {
    if (!name.trim()) return;
    addWorkout({
      name: name.trim(), type: wType, duration: parseInt(duration) || 30,
      sets: sets ? parseInt(sets) : undefined, reps: reps ? parseInt(reps) : undefined,
      completed: false, date,
    });
    setName("");
    setShowAdd(false);
  };

  const todayCompleted = todayWorkouts.filter(w => w.completed).length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold neon-text-purple">WORKOUT PLANNER</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            TODAY: {todayCompleted}/{todayWorkouts.length} COMPLETED
          </p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} variant="outline" className="border-accent/30 text-accent hover:bg-accent/10">
          <Plus className="w-4 h-4 mr-2" /> Add Workout
        </Button>
      </motion.div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-panel-purple p-4 space-y-3">
          <Input placeholder="Workout name..." value={name} onChange={e => setName(e.target.value)} className="bg-muted/50 border-glass-border" />
          <div className="flex gap-2 flex-wrap">
            <Select value={wType} onValueChange={setWType}>
              <SelectTrigger className="w-32 bg-muted/50 border-glass-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WORKOUT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Minutes" value={duration} onChange={e => setDuration(e.target.value)} className="w-24 bg-muted/50 border-glass-border" />
            <Input type="number" placeholder="Sets" value={sets} onChange={e => setSets(e.target.value)} className="w-20 bg-muted/50 border-glass-border" />
            <Input type="number" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)} className="w-20 bg-muted/50 border-glass-border" />
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-muted/50 border-glass-border" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} className="bg-accent text-accent-foreground">Create</Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {/* Today's Workouts */}
      {todayWorkouts.length > 0 && (
        <div>
          <h2 className="font-display text-sm font-bold text-muted-foreground mb-3">TODAY'S SESSION</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayWorkouts.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-panel p-4 ${w.completed ? "border-success/30 opacity-60" : "border-accent/20"}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`font-medium ${w.completed ? "line-through text-muted-foreground" : ""}`}>{w.name}</h3>
                    <p className="text-[10px] font-mono text-muted-foreground mt-1">
                      {w.type.toUpperCase()} • {w.duration}MIN
                      {w.sets && ` • ${w.sets} SETS`}
                      {w.reps && ` × ${w.reps} REPS`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => !w.completed && completeWorkout(w.id)}>
                      {w.completed ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5 text-muted-foreground hover:text-accent" />}
                    </button>
                    <button onClick={() => deleteWorkout(w.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All Workouts */}
      <div>
        <h2 className="font-display text-sm font-bold text-muted-foreground mb-3">ALL WORKOUTS</h2>
        {workouts.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-mono text-muted-foreground text-sm">NO WORKOUTS SCHEDULED</p>
          </div>
        ) : (
          <div className="space-y-2">
            {workouts.sort((a, b) => b.date.localeCompare(a.date)).map(w => (
              <div key={w.id} className="mission-item">
                <button onClick={() => !w.completed && completeWorkout(w.id)}>
                  {w.completed ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${w.completed ? "line-through text-muted-foreground" : ""}`}>{w.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{w.type} • {w.duration}MIN • {w.date}</p>
                </div>
                <button onClick={() => deleteWorkout(w.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}