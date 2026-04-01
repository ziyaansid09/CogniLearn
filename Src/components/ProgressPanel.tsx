import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface Props {
  timeAccuracy: number;
  masteryAccuracy: number;
  progressAccuracy: number;
  plannedHours: number;
  completedHours: number;
  masteredModules: number;
  totalModules: number;
}

export default function ProgressPanel(props: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-panel-purple p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-neon-purple" />
        <h3 className="font-display text-lg font-bold">PROGRESS</h3>
      </div>

      {/* Main accuracy circle */}
      <div className="flex justify-center mb-4">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <motion.circle
              cx="50" cy="50" r="42" fill="none"
              stroke="url(#gradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - props.progressAccuracy / 100) }}
              transition={{ duration: 1.5, delay: 0.5 }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--neon-cyan))" />
                <stop offset="100%" stopColor="hsl(var(--neon-purple))" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="stat-value text-2xl">{props.progressAccuracy}%</span>
            <span className="text-[9px] text-muted-foreground font-mono">ACCURACY</span>
          </div>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="space-y-3">
        <AccuracyBar label="Time Accuracy" value={props.timeAccuracy} color="primary" />
        <AccuracyBar label="Mastery Accuracy" value={props.masteryAccuracy} color="accent" />
      </div>

      <div className="mt-3 flex justify-between text-xs text-muted-foreground font-mono">
        <span>Planned: {props.plannedHours}h</span>
        <span>Done: {props.completedHours}h</span>
      </div>
    </motion.div>
  );
}

function AccuracyBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-mono text-${color}`}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </div>
    </div>
  );
}