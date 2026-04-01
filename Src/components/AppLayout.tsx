import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, Target, Dumbbell,
  ListTodo, Bot, ChevronLeft, ChevronRight, LogOut, User
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import cognifitLogo from "@/assets/cogniLearn-logo.png";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/library", label: "Library", icon: BookOpen },
  { path: "/tasks", label: "Missions", icon: ListTodo },
  { path: "/workout", label: "Workout", icon: Dumbbell },
  { path: "/targets", label: "Targets", icon: Target },
  { path: "/assistant", label: "AI Assistant", icon: Bot },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-0 h-screen z-50 glass-panel border-r border-glass-border flex flex-col"
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-glass-border">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img src={cognifitLogo} alt="Cognilearn" className="w-11 h-11 object-contain" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden"
              >
                <h1 className="font-display text-sm font-bold neon-text whitespace-nowrap">COGNILEARN</h1>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User info */}
        {user && (
          <div className="px-3 py-3 border-b border-glass-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-accent" />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="overflow-hidden min-w-0"
                  >
                    <p className="text-xs font-medium truncate">{user.displayName || "Agent"}</p>
                    <p className="text-[9px] text-muted-foreground font-mono truncate">{user.email}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  active
                    ? "bg-primary/10 border border-primary/30 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-primary" : ""}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Logout + Collapse */}
        <div className="border-t border-glass-border">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-5 py-3 text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-mono">
                  LOGOUT
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full p-3 border-t border-glass-border text-muted-foreground hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5 mx-auto" /> : <ChevronLeft className="w-5 h-5 mx-auto" />}
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <main
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: collapsed ? 72 : 240 }}
      >
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}