// localStorage-based store (ready for Firebase/Supabase migration)
import { useState, useEffect, useCallback } from "react";

// Types
export interface Subject {
  id: string;
  name: string;
  color: string;
  modules: Module[];
  createdAt: string;
}

export interface Module {
  id: string;
  subjectId: string;
  name: string;
  duration: number; // hours
  completed: boolean;
  quiz?: Quiz;
  topics: string[];
}

export interface Quiz {
  id: string;
  moduleId: string;
  questions: QuizQuestion[];
  score?: number;
  totalScore?: number;
  completedAt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  userAnswer?: number;
}

export interface Task {
  id: string;
  title: string;
  type: "study" | "workout" | "penalty";
  status: "pending" | "completed" | "missed";
  date: string;
  duration: number; // minutes
  subjectId?: string;
  moduleId?: string;
  isPenalty?: boolean;
  createdAt: string;
}

export interface WorkoutTask {
  id: string;
  name: string;
  type: string;
  duration: number; // minutes
  sets?: number;
  reps?: number;
  completed: boolean;
  date: string;
}

export interface Target {
  id: string;
  title: string;
  type: "daily" | "weekly";
  category: "study" | "workout" | "mixed";
  deadline: string;
  tasksRequired: number;
  tasksCompleted: number;
  completed: boolean;
  penaltyAssigned: boolean;
  createdAt: string;
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNext: number;
  totalCompleted: number;
  streak: number;
  plannedHours: number;
  completedHours: number;
}

// Helper
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadData<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(`cognifit_${key}`);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveData<T>(key: string, data: T): void {
  localStorage.setItem(`cognifit_${key}`, JSON.stringify(data));
}

// Hooks
export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>(() => loadData("subjects", []));

  useEffect(() => { saveData("subjects", subjects); }, [subjects]);

  const addSubject = useCallback((name: string, color: string) => {
    const subject: Subject = { id: generateId(), name, color, modules: [], createdAt: new Date().toISOString() };
    setSubjects(prev => [...prev, subject]);
    return subject;
  }, []);

  const addModule = useCallback((subjectId: string, name: string, duration: number, topics: string[]) => {
    const module: Module = { id: generateId(), subjectId, name, duration, completed: false, topics };
    setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, modules: [...s.modules, module] } : s));
    return module;
  }, []);

  const completeModule = useCallback((subjectId: string, moduleId: string) => {
    setSubjects(prev => prev.map(s => s.id === subjectId
      ? { ...s, modules: s.modules.map(m => m.id === moduleId ? { ...m, completed: true } : m) }
      : s
    ));
  }, []);

  const saveQuiz = useCallback((subjectId: string, moduleId: string, quiz: Quiz) => {
    setSubjects(prev => prev.map(s => s.id === subjectId
      ? { ...s, modules: s.modules.map(m => m.id === moduleId ? { ...m, quiz } : m) }
      : s
    ));
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  }, []);

  const deleteModule = useCallback((subjectId: string, moduleId: string) => {
    setSubjects(prev => prev.map(s => s.id === subjectId
      ? { ...s, modules: s.modules.filter(m => m.id !== moduleId) }
      : s
    ));
  }, []);

  return { subjects, addSubject, addModule, completeModule, saveQuiz, deleteSubject, deleteModule };
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => loadData("tasks", []));

  useEffect(() => { saveData("tasks", tasks); }, [tasks]);

  const addTask = useCallback((task: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = { ...task, id: generateId(), createdAt: new Date().toISOString() };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, []);

  const completeTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: "completed" } : t));
  }, []);

  const missTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: "missed" } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const todayTasks = tasks.filter(t => t.date === new Date().toISOString().split("T")[0]);

  return { tasks, todayTasks, addTask, completeTask, missTask, deleteTask };
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<WorkoutTask[]>(() => loadData("workouts", []));

  useEffect(() => { saveData("workouts", workouts); }, [workouts]);

  const addWorkout = useCallback((workout: Omit<WorkoutTask, "id">) => {
    const newWorkout: WorkoutTask = { ...workout, id: generateId() };
    setWorkouts(prev => [...prev, newWorkout]);
    return newWorkout;
  }, []);

  const completeWorkout = useCallback((id: string) => {
    setWorkouts(prev => prev.map(w => w.id === id ? { ...w, completed: true } : w));
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setWorkouts(prev => prev.filter(w => w.id !== id));
  }, []);

  const todayWorkouts = workouts.filter(w => w.date === new Date().toISOString().split("T")[0]);

  return { workouts, todayWorkouts, addWorkout, completeWorkout, deleteWorkout };
}

export function useTargets() {
  const [targets, setTargets] = useState<Target[]>(() => loadData("targets", []));

  useEffect(() => { saveData("targets", targets); }, [targets]);

  const addTarget = useCallback((target: Omit<Target, "id" | "completed" | "penaltyAssigned" | "createdAt">) => {
    const newTarget: Target = { ...target, id: generateId(), completed: false, penaltyAssigned: false, createdAt: new Date().toISOString() };
    setTargets(prev => [...prev, newTarget]);
    return newTarget;
  }, []);

  const updateTargetProgress = useCallback((id: string, tasksCompleted: number) => {
    setTargets(prev => prev.map(t => {
      if (t.id !== id) return t;
      const completed = tasksCompleted >= t.tasksRequired;
      return { ...t, tasksCompleted, completed };
    }));
  }, []);

  const assignPenalty = useCallback((id: string) => {
    setTargets(prev => prev.map(t => t.id === id ? { ...t, penaltyAssigned: true } : t));
  }, []);

  const deleteTarget = useCallback((id: string) => {
    setTargets(prev => prev.filter(t => t.id !== id));
  }, []);

  const missedTargets = targets.filter(t => !t.completed && new Date(t.deadline) < new Date());
  const activeTargets = targets.filter(t => !t.completed && new Date(t.deadline) >= new Date());

  return { targets, activeTargets, missedTargets, addTarget, updateTargetProgress, assignPenalty, deleteTarget };
}

export function useStats(tasks: Task[], subjects: Subject[]): UserStats {
  const completedTasks = tasks.filter(t => t.status === "completed");
  const totalCompleted = completedTasks.length;
  const xp = totalCompleted * 25;
  const level = Math.floor(xp / 100) + 1;
  const xpToNext = 100 - (xp % 100);

  const plannedHours = tasks.reduce((sum, t) => sum + t.duration / 60, 0);
  const completedHours = completedTasks.reduce((sum, t) => sum + t.duration / 60, 0);

  // Calculate streak
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayTasks = tasks.filter(t => t.date === dateStr);
    if (dayTasks.length > 0 && dayTasks.some(t => t.status === "completed")) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return { level, xp, xpToNext, totalCompleted, streak, plannedHours, completedHours };
}

export function calculateProgress(tasks: Task[], subjects: Subject[]) {
  const completedTasks = tasks.filter(t => t.status === "completed");
  const plannedHours = tasks.reduce((sum, t) => sum + t.duration / 60, 0);
  const completedHours = completedTasks.reduce((sum, t) => sum + t.duration / 60, 0);

  const timeAccuracy = plannedHours > 0 ? completedHours / plannedHours : 0;

  // Mastery: modules with quiz score >= 75% are mastered
  let totalModules = 0;
  let masteredModules = 0;
  subjects.forEach(s => s.modules.forEach(m => {
    totalModules++;
    if (m.quiz?.score !== undefined && m.quiz?.totalScore && m.quiz.totalScore > 0) {
      const pct = (m.quiz.score / m.quiz.totalScore) * 100;
      if (pct >= 75) masteredModules++;
    }
  }));

  const masteryAccuracy = totalModules > 0 ? masteredModules / totalModules : 0;
  const progressAccuracy = 0.4 * timeAccuracy + 0.6 * masteryAccuracy;

  return {
    timeAccuracy: Math.round(timeAccuracy * 100),
    masteryAccuracy: Math.round(masteryAccuracy * 100),
    progressAccuracy: Math.round(progressAccuracy * 100),
    plannedHours: Math.round(plannedHours * 10) / 10,
    completedHours: Math.round(completedHours * 10) / 10,
    masteredModules,
    totalModules,
  };
}

export function calculateWorkoutProgress(workouts: WorkoutTask[]) {
  const total = workouts.length;
  const completed = workouts.filter(w => w.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percentage };
}