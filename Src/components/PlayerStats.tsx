import { motion } from "framer-motion";
import { Shield, Flame, Star, Clock } from "lucide-react";
import type { UserStats } from "@/lib/store";

export default function PlayerStats({ stats, userName }: { stats: UserStats; userName?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel-glow p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">{userName || "USER"}</h3>
          <p className="text-xs text-muted-foreground font-mono">RANK: {stats.level < 5 ? "E" : stats.level < 10 ? "D" : stats.level < 20 ? "C" : stats.level < 30 ? "B" : stats.level < 50 ? "A" : "S"}</p>
        </div>
      </div>

      {/* Level & XP */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-mono text-primary">LVL {stats.level}</span>
          <span className="text-muted-foreground font-mono">{stats.xp % 100}/100 XP</span>
        </div>
        <div className="xp-bar">
          <motion.div
            className="xp-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${(stats.xp % 100)}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatItem icon={Star} label="Completed" value={stats.totalCompleted} />
        <StatItem icon={Flame} label="Streak" value={`${stats.streak}d`} />
        <StatItem icon={Clock} label="Planned" value={`${stats.plannedHours.toFixed(1)}h`} />
        <StatItem icon={Clock} label="Done" value={`${stats.completedHours.toFixed(1)}h`} />
      </div>
    </motion.div>
  );
}

function StatItem({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="glass-panel p-3 text-center">
      <Icon className="w-4 h-4 text-neon-purple mx-auto mb-1" />
      <div className="stat-value text-lg">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase font-mono">{label}</div>
    </div>
  );
}