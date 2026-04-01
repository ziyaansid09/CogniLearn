import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Send, Sparkles, Brain, Dumbbell, BookOpen, Target, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubjects, useTasks, useWorkouts, useTargets, useStats, calculateProgress, calculateWorkoutProgress } from "@/lib/firestore-store";
import { useAuth } from "@/lib/auth-context";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Suggest a study schedule for today",
  "How can I improve my mastery accuracy?",
  "Recommend a workout routine",
  "What should I prioritize this week?",
  "Suggest a diet plan for fitness",
  "Analyze my progress and give tips",
];

export default function Assistant() {
  const { user } = useAuth();
  const { subjects } = useSubjects();
  const { tasks } = useTasks();
  const { workouts } = useWorkouts();
  const { activeTargets, missedTargets } = useTargets();
  const stats = useStats(tasks, subjects);
  const progress = calculateProgress(tasks, subjects);
  const workoutProgress = calculateWorkoutProgress(workouts);

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `SYSTEM ONLINE. Welcome, ${user?.displayName || "Agent"}. I am your AI Study & Fitness Advisor. I have access to your real-time progress data and can provide personalized recommendations.\n\nAsk me about study strategies, workout plans, diet, scheduling, or productivity tips.` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const context = {
    userName: user?.displayName || "Agent",
    stats,
    progress,
    workoutProgress,
    subjects,
    tasks,
    workouts,
    activeTargets,
    missedTargets,
    pendingTasks: tasks.filter(t => t.status === "pending"),
    completedTasks: tasks.filter(t => t.status === "completed"),
    missedTasks: tasks.filter(t => t.status === "missed"),
    todayTasks: tasks.filter(t => t.date === new Date().toISOString().split("T")[0]),
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

   setTimeout(async () => {

  const smartResponse = generateSmartResponse(text.trim(), context);

  // If smartResponse is default generic message → use Gemini
  if (smartResponse.includes("AI ADVISOR RESPONSE")) {

    const prompt = `
You are the AI assistant inside CogniFit Learn.

User Name: ${context.userName}

User Progress:
- Overall Progress: ${context.progress.progressAccuracy}%
- Mastery: ${context.progress.masteryAccuracy}%
- Workout Completion: ${context.workoutProgress.percentage}%
- Pending Tasks: ${context.pendingTasks.length}
- Active Targets: ${context.activeTargets.length}

User Question:
${text}

Give helpful study, productivity, fitness, or diet advice.
Keep the answer structured and concise.
`;

    const aiReply = await generateGeminiResponse(prompt);

    setMessages(prev => [...prev, { role: "assistant", content: aiReply }]);

  } else {

    setMessages(prev => [...prev, { role: "assistant", content: smartResponse }]);

  }

  setLoading(false);

}, 600);
  };

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-display font-bold neon-text-purple">AI ASSISTANT</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">CONTEXT-AWARE ADVISOR • STUDY & FITNESS</p>
      </motion.div>

      {/* Quick prompts */}
      <div className="flex gap-1.5 flex-wrap">
        {QUICK_PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            className="text-[11px] font-mono px-2 py-1 glass-panel text-muted-foreground hover:text-foreground hover:border-accent/30 transition-colors"
          >
            <Sparkles className="w-3 h-3 inline mr-1" />{p}
          </button>
        ))}
      </div>

      {/* Chat */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 glass-panel p-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
              msg.role === "user"
                ? "bg-primary/20 border border-primary/30"
                : "glass-panel border-accent/20"
            }`}>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1 mb-1 text-[10px] font-mono text-accent">
                  <Bot className="w-3 h-3" /> SYSTEM
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="w-4 h-4 animate-glow-pulse text-accent" />
            <span className="font-mono text-xs">ANALYZING YOUR DATA...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Ask anything — study, fitness, diet, productivity..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage(input)}
          className="bg-muted/50 border-glass-border"
        />
        <Button onClick={() => sendMessage(input)} className="bg-accent text-accent-foreground">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

interface UserContext {
  userName: string;
  stats: any;
  progress: any;
  workoutProgress: any;
  subjects: any[];
  tasks: any[];
  workouts: any[];
  activeTargets: any[];
  missedTargets: any[];
  pendingTasks: any[];
  completedTasks: any[];
  missedTasks: any[];
  todayTasks: any[];
}

async function generateGeminiResponse(prompt: string) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
  model: "llama-3.3-70b-versatile",
  messages: [
    {
      role: "system",
      content:
        "You are an AI assistant for CogniLearn. Give concise, useful answers about study, fitness, productivity and scheduling.",
    },
    {
      role: "user",
      content: prompt,
    },
  ],
  temperature: 0.7,
  max_tokens: 500,
}),
      }
    );

    const data = await response.json();

    console.log("Groq Response:", data);

    if (!response.ok) {
      return `Groq Error: ${data?.error?.message || "Unknown error"}`;
    }

    return (
      data?.choices?.[0]?.message?.content ||
      "No response generated."
    );
  } catch (error) {
    console.error("Groq Fetch Error:", error);
    return "Unable to connect to Groq AI.";
  }
}

function generateSmartResponse(input: string, ctx: UserContext): string {
  const lower = input.toLowerCase();

  // Analyze progress
  if (lower.includes("analyze") || lower.includes("progress") || lower.includes("how am i doing")) {
    const lines = [`📊 PROGRESS ANALYSIS FOR ${ctx.userName.toUpperCase()}:\n`];
    lines.push(`📈 Overall Progress Accuracy: ${ctx.progress.progressAccuracy}%`);
    lines.push(`📚 Study Mastery: ${ctx.progress.masteredModules}/${ctx.progress.totalModules} modules mastered (${ctx.progress.masteryAccuracy}%)`);
    lines.push(`⏱ Time Efficiency: ${ctx.progress.completedHours}/${ctx.progress.plannedHours}h completed (${ctx.progress.timeAccuracy}%)`);
    lines.push(`🏋️ Workout: ${ctx.workoutProgress.completed}/${ctx.workoutProgress.total} completed (${ctx.workoutProgress.percentage}%)`);
    lines.push(`🔥 Current Streak: ${ctx.stats.streak} days`);
    lines.push(`⭐ Level: ${ctx.stats.level} | XP: ${ctx.stats.xp}`);

    if (ctx.progress.progressAccuracy < 30) lines.push("\n⚠️ Your progress is low. Focus on completing modules and taking quizzes to improve mastery.");
    else if (ctx.progress.progressAccuracy < 60) lines.push("\n💡 Decent progress! Focus on quiz scores ≥75% to boost mastery accuracy.");
    else lines.push("\n✅ Strong progress! Keep maintaining consistency.");

    if (ctx.missedTargets.length > 0) lines.push(`\n🚨 You have ${ctx.missedTargets.length} missed target(s). Complete penalty tasks first.`);

    return lines.join("\n");
  }

  // Study schedule
  if (lower.includes("study") && (lower.includes("schedule") || lower.includes("plan"))) {
    const pendingStudy = ctx.pendingTasks.filter(t => t.type === "study");
    const unmastered = ctx.subjects.flatMap(s => s.modules?.filter((m: any) => {
      if (!m.quiz?.score || !m.quiz?.totalScore) return !m.completed;
      return (m.quiz.score / m.quiz.totalScore) * 100 < 75;
    }).map((m: any) => ({ subject: s.name, module: m.name })) || []);

    let response = `📋 PERSONALIZED STUDY PLAN FOR ${ctx.userName}:\n\n`;

    if (pendingStudy.length > 0) {
      response += `You have ${pendingStudy.length} pending study task(s).\n\n`;
    }

    response += `06:00 - 08:00 → Deep focus session (hardest unmastered subject)\n`;
    response += `08:00 - 08:30 → Break + light stretching\n`;
    response += `08:30 - 10:00 → Second subject review\n`;
    response += `10:00 - 10:30 → Workout session\n`;
    response += `10:30 - 12:00 → Practice problems / quiz prep\n`;
    response += `14:00 - 15:30 → Revision of weak modules\n`;
    response += `16:00 - 17:00 → Quiz attempts for mastery\n\n`;

    if (unmastered.length > 0) {
      response += `📌 PRIORITY MODULES (Not Yet Mastered):\n`;
      unmastered.slice(0, 5).forEach((m, i) => {
        response += `${i + 1}. ${m.subject} → ${m.module}\n`;
      });
      response += `\n💡 Focus on these modules and aim for ≥75% quiz score to improve mastery.`;
    } else {
      response += `✅ All modules mastered! Consider revising or adding new subjects.`;
    }

    return response;
  }

  // Mastery
  if (lower.includes("mastery") || lower.includes("accuracy") || lower.includes("quiz")) {
    let response = `📈 MASTERY IMPROVEMENT STRATEGY:\n\n`;
    response += `Current Mastery: ${ctx.progress.masteryAccuracy}% (${ctx.progress.masteredModules}/${ctx.progress.totalModules} modules)\n\n`;
    response += `1. Take quizzes after EACH module completion\n`;
    response += `2. You need ≥75% to mark a module as "mastered"\n`;
    response += `3. Review incorrect answers before retaking\n`;
    response += `4. Use spaced repetition — revisit after 1, 3, 7 days\n`;
    response += `5. Focus on understanding concepts, not memorization\n\n`;
    response += `🎯 Mastery weight in progress: 60% (MasteryAccuracy)\n`;
    response += `⏱ Time weight in progress: 40% (TimeAccuracy)\n\n`;

    const lowScoreModules = ctx.subjects.flatMap(s =>
      s.modules?.filter((m: any) => m.quiz?.score !== undefined && m.quiz?.totalScore && (m.quiz.score / m.quiz.totalScore) * 100 < 75)
        .map((m: any) => ({ name: `${s.name} → ${m.name}`, score: Math.round((m.quiz.score / m.quiz.totalScore) * 100) })) || []
    );

    if (lowScoreModules.length > 0) {
      response += `⚠️ Modules below 75% mastery:\n`;
      lowScoreModules.forEach(m => { response += `• ${m.name} (${m.score}%)\n`; });
    }

    return response;
  }

  // Workout
  if (lower.includes("workout") || lower.includes("exercise") || lower.includes("routine") || lower.includes("gym")) {
    let response = `🏋️ WORKOUT RECOMMENDATIONS:\n\n`;
    response += `Current Status: ${ctx.workoutProgress.completed}/${ctx.workoutProgress.total} workouts completed\n\n`;
    response += `BALANCED WEEKLY ROUTINE:\n`;
    response += `MON: Upper body strength (30 min)\n`;
    response += `TUE: Cardio / Running (25 min)\n`;
    response += `WED: Core & flexibility (20 min)\n`;
    response += `THU: Lower body strength (30 min)\n`;
    response += `FRI: HIIT session (20 min)\n`;
    response += `SAT: Active recovery / Yoga (30 min)\n`;
    response += `SUN: Rest day\n\n`;
    response += `💡 Schedule workouts between study sessions to boost focus and memory retention.\n`;
    response += `⚡ Even 15 minutes of exercise improves cognitive performance by 20%.`;
    return response;
  }

  // Diet
  if (lower.includes("diet") || lower.includes("food") || lower.includes("nutrition") || lower.includes("calorie") || lower.includes("meal") || lower.includes("eat")) {
    let response = `🍽️ NUTRITION & DIET GUIDE:\n\n`;

    if (lower.includes("bulk") || lower.includes("gain") || lower.includes("mass")) {
      response += `💪 BULKING PLAN (Caloric Surplus):\n\n`;
      response += `Daily Target: ~2,800-3,200 calories\n`;
      response += `Protein: 1.6-2.2g per kg body weight\n\n`;
      response += `MEAL PLAN:\n`;
      response += `Breakfast: Oats + banana + eggs + milk (600 cal)\n`;
      response += `Mid-morning: Peanut butter sandwich + shake (400 cal)\n`;
      response += `Lunch: Rice + chicken/paneer + dal + veggies (700 cal)\n`;
      response += `Pre-workout: Banana + handful of nuts (200 cal)\n`;
      response += `Post-workout: Protein shake + banana (350 cal)\n`;
      response += `Dinner: Roti + sabzi + curd + salad (550 cal)\n`;
    } else if (lower.includes("cut") || lower.includes("lose") || lower.includes("lean") || lower.includes("fat")) {
      response += `🔥 CUTTING PLAN (Caloric Deficit):\n\n`;
      response += `Daily Target: ~1,800-2,200 calories\n`;
      response += `Protein: 2.0-2.4g per kg body weight (preserve muscle)\n\n`;
      response += `MEAL PLAN:\n`;
      response += `Breakfast: Egg whites + oats + black coffee (350 cal)\n`;
      response += `Mid-morning: Greek yogurt + berries (150 cal)\n`;
      response += `Lunch: Grilled chicken/fish + brown rice + salad (500 cal)\n`;
      response += `Snack: Boiled eggs + cucumber (150 cal)\n`;
      response += `Dinner: Soup + grilled veggies + lean protein (400 cal)\n`;
    } else {
      response += `⚖️ BALANCED STUDENT DIET:\n\n`;
      response += `Daily Target: ~2,200-2,500 calories\n\n`;
      response += `🥣 Breakfast: Oats/poha + eggs + fruit + milk\n`;
      response += `🥪 Mid-morning: Nuts + fruit or sandwich\n`;
      response += `🍛 Lunch: Rice/roti + protein + dal + veggies\n`;
      response += `🍌 Snack: Banana + peanut butter or sprouts\n`;
      response += `🥗 Dinner: Light meal — soup, salad, roti + sabzi\n\n`;
      response += `💧 Water: 3-4 liters daily\n`;
      response += `☕ Caffeine: Max 2 cups (before 3 PM for better sleep)\n`;
      response += `🧠 Brain foods: Walnuts, blueberries, dark chocolate, fish\n`;
    }

    return response;
  }

  // Prioritize
  if (lower.includes("prioritize") || lower.includes("week") || lower.includes("focus") || lower.includes("what should")) {
    let response = `📊 PRIORITY ANALYSIS FOR ${ctx.userName}:\n\n`;

    if (ctx.missedTargets.length > 0) {
      response += `🚨 URGENT: ${ctx.missedTargets.length} missed target(s) — complete penalty tasks FIRST\n\n`;
    }

    const penaltyTasks = ctx.pendingTasks.filter(t => t.isPenalty);
    if (penaltyTasks.length > 0) {
      response += `⚠️ ${penaltyTasks.length} penalty task(s) must be completed before new tasks\n\n`;
    }

    response += `PRIORITY ORDER:\n`;
    response += `1. Complete penalty tasks (mandatory)\n`;
    response += `2. Focus on subjects with lowest mastery scores\n`;
    response += `3. Maintain daily workout routine\n`;
    response += `4. Set 3-5 realistic targets with proper deadlines\n`;
    response += `5. Review missed targets and adjust schedule\n\n`;

    response += `📈 Current Stats:\n`;
    response += `• Pending tasks: ${ctx.pendingTasks.length}\n`;
    response += `• Active targets: ${ctx.activeTargets.length}\n`;
    response += `• Streak: ${ctx.stats.streak} days\n`;
    response += `• Progress: ${ctx.progress.progressAccuracy}%\n\n`;
    response += `⚡ Consistency > Intensity. Small daily progress beats sporadic big efforts.`;

    return response;
  }

  // Burnout / rest
  if (lower.includes("tired") || lower.includes("burnout") || lower.includes("rest") || lower.includes("overwhelm") || lower.includes("stress")) {
    return `🧘 BURNOUT PREVENTION & RECOVERY:\n\nI can see you've been working hard (Level ${ctx.stats.level}, ${ctx.stats.totalCompleted} tasks completed).\n\nIMMEDIATE STEPS:\n1. Take a 30-minute break — walk outside or stretch\n2. Hydrate — drink a full glass of water\n3. Do deep breathing: 4 seconds in, 7 hold, 8 out\n\nSCHEDULE ADJUSTMENT:\n• Reduce daily tasks by 30% for 2-3 days\n• Replace one study session with light exercise\n• Sleep at least 7-8 hours tonight\n• Avoid screens 30 min before bed\n\nLONG-TERM:\n• Use the 50-10 rule: 50 min work, 10 min break\n• Schedule 1 full rest day per week\n• Balance study and workout — don't skip workouts\n\n💡 Rest is not laziness — it's part of the system. Your brain consolidates learning during rest.`;
  }

  // Missed tasks
  if (lower.includes("missed") || lower.includes("penalty") || lower.includes("failed")) {
    let response = `⚠️ MISSED TASK & PENALTY ANALYSIS:\n\n`;
    response += `Missed tasks: ${ctx.missedTasks.length}\n`;
    response += `Missed targets: ${ctx.missedTargets.length}\n\n`;

    if (ctx.missedTasks.length > 0 || ctx.missedTargets.length > 0) {
      response += `RECOVERY PLAN:\n`;
      response += `1. Complete all penalty tasks immediately\n`;
      response += `2. Reschedule missed study tasks for tomorrow\n`;
      response += `3. Set more realistic deadlines going forward\n`;
      response += `4. Break large tasks into smaller chunks\n`;
      response += `5. Use the Target system with achievable goals\n\n`;
      response += `💡 Missing targets occasionally is normal. The key is to recover quickly and adjust your planning.`;
    } else {
      response += `✅ No missed tasks or targets! You're on track. Keep up the discipline.`;
    }

    return response;
  }

  // Time management
  if (lower.includes("time") || lower.includes("manage") || lower.includes("productive") || lower.includes("productivity")) {
    return `⏰ TIME MANAGEMENT & PRODUCTIVITY:\n\nBased on your data (${ctx.progress.completedHours}/${ctx.progress.plannedHours}h completed):\n\nTECHNIQUES:\n1. Pomodoro: 25 min focus + 5 min break (4 cycles = 1 set)\n2. Time blocking: Assign specific hours to specific subjects\n3. 2-Minute Rule: If a task takes <2 min, do it now\n4. Eat the Frog: Do hardest task first in the morning\n5. Batching: Group similar tasks together\n\nOPTIMAL STUDY TIMES:\n🌅 06:00-10:00 → Peak focus (complex subjects)\n🌤 10:00-12:00 → Good focus (practice/review)\n🌆 14:00-16:00 → Moderate (lighter topics)\n🌙 20:00-22:00 → Review & revision\n\n🏋️ Best workout time: Between study sessions (boosts cognitive performance)\n\n💡 Track your energy levels for a week to find YOUR optimal times.`;
  }

  // Exam prep
  if (lower.includes("exam") || lower.includes("revision") || lower.includes("prepare") || lower.includes("test")) {
    const mastered = ctx.progress.masteredModules;
    const total = ctx.progress.totalModules;
    return `📝 EXAM PREPARATION STRATEGY:\n\nYour Readiness: ${mastered}/${total} modules mastered (${ctx.progress.masteryAccuracy}%)\n\n7-DAY EXAM PREP PLAN:\n\nDay 1-2: Review all unmastered modules\nDay 3-4: Take quizzes for each module (aim ≥75%)\nDay 5: Focus on weakest subjects\nDay 6: Full revision + mock tests\nDay 7: Light review + rest\n\nTECHNIQUES:\n1. Active recall > passive reading\n2. Teach concepts out loud (Feynman method)\n3. Create mind maps for each subject\n4. Use flashcards for key formulas/concepts\n5. Past papers are your best friend\n\n⚡ Your quiz scores directly affect mastery. Retake failed quizzes until you hit 75%+.`;
  }

  // Default — general knowledge response
  return `🤖 AI ADVISOR RESPONSE:\n\nI can help you with:\n\n📚 STUDY:\n• Study schedule optimization\n• Mastery improvement strategies\n• Exam preparation plans\n• Subject-specific guidance\n\n🏋️ FITNESS:\n• Workout routine planning\n• Diet plans (bulking/cutting/balanced)\n• Calorie guidance\n• Recovery strategies\n\n📊 PRODUCTIVITY:\n• Time management techniques\n• Priority planning\n• Burnout prevention\n• Task management advice\n\n🎯 YOUR CURRENT STATUS:\n• Level: ${ctx.stats.level} | XP: ${ctx.stats.xp}\n• Progress: ${ctx.progress.progressAccuracy}%\n• Streak: ${ctx.stats.streak} days\n• Pending: ${ctx.pendingTasks.length} tasks\n\nTry asking specific questions for detailed personalized guidance!`;
}