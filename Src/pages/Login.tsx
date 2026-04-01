import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, User, LogIn, UserPlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";

export default function Login() {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        if (!name.trim()) { setError("Name is required"); setLoading(false); return; }
        await signup(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Invalid email or password");
      } else if (code === "auth/email-already-in-use") {
        setError("Email already registered. Please login.");
      } else if (code === "auth/weak-password") {
        setError("Password must be at least 6 characters");
      } else if (code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError(err.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(var(--neon-cyan)) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(var(--neon-purple)) 0%, transparent 70%)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-4"
            style={{ boxShadow: "var(--glow-cyan)" }}
          >
            <Zap className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="font-display text-2xl font-bold neon-text">COGNILEARN</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">AI STUDY & FITNESS SYSTEM</p>
        </div>

        {/* Form */}
        <div className="glass-panel-glow p-6">
          <h2 className="font-display text-lg font-bold text-center mb-6">
            {isSignup ? "CREATE ACCOUNT" : "SYSTEM LOGIN"}
          </h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm mb-4"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="pl-10 bg-muted/50 border-glass-border"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-10 bg-muted/50 border-glass-border"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 bg-muted/50 border-glass-border"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={loading}>
              {loading ? (
                <span className="font-mono text-xs animate-glow-pulse">AUTHENTICATING...</span>
              ) : isSignup ? (
                <><UserPlus className="w-4 h-4 mr-2" /> CREATE ACCOUNT</>
              ) : (
                <><LogIn className="w-4 h-4 mr-2" /> LOGIN</>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsSignup(!isSignup); setError(""); }}
              className="text-sm text-muted-foreground hover:text-primary font-mono transition-colors"
            >
              {isSignup ? "Already have an account? LOGIN" : "New user? CREATE ACCOUNT"}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground font-mono mt-4">
          SECURE AUTHENTICATION SYSTEM • FIREBASE v10
        </p>
      </motion.div>
    </div>
  );
}