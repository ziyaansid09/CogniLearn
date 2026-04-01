// Firestore-backed data hooks — per-user data isolation
import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import type { Subject, Module, Quiz, Task, WorkoutTask, Target, UserStats } from "./store";
export type { Subject, Module, Quiz, Task, WorkoutTask, Target, UserStats };
export { calculateProgress, calculateWorkoutProgress } from "./store";

function useFirestoreField<T>(field: string, defaultValue: T): [T, (updater: T | ((prev: T) => T)) => void, boolean] {
  const { user } = useAuth();
  const [data, setData] = useState<T>(defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!user) {
      setData(defaultValue);
      setIsHydrated(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        if (snap.exists()) {
          const val = snap.data()?.[field];
          setData((val !== undefined ? val : defaultValue) as T);
        } else {
          setData(defaultValue);
        }
        setIsHydrated(true);
      },
      (error) => {
        console.error(`[Firestore] Error listening to "${field}":`, error.message);
        if (error.code === "permission-denied") {
          console.error("[Firestore] Update your Firestore Security Rules in Firebase Console to allow authenticated user access.");
        }
        setIsHydrated(true);
      }
    );
    return unsub;
  }, [user, field]);

  const updateData = useCallback((updater: T | ((prev: T) => T)) => {
    if (!user) return;
    if (!isHydrated) {
      console.warn(`[Firestore] Skipping write for "${field}" until initial data is loaded.`);
      return;
    }

    setData(prev => {
      const next = typeof updater === "function" ? (updater as (prev: T) => T)(prev) : updater;
      setDoc(doc(db, "users", user.uid), { [field]: next }, { merge: true }).catch((error) => {
        console.error(`[Firestore] Failed writing "${field}":`, error.message);
      });
      return next;
    });
  }, [user, field, isHydrated]);

  return [data, updateData, isHydrated];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function useSubjects() {
  const [subjects, setSubjects, loaded] = useFirestoreField<Subject[]>("subjects", []);

  const addSubject = useCallback((name: string, color: string) => {
    const subject: Subject = { id: generateId(), name, color, modules: [], createdAt: new Date().toISOString() };
    setSubjects(prev => [...prev, subject]);
    return subject;
  }, [setSubjects]);

  const addModule = useCallback((subjectId: string, name: string, duration: number, topics: string[]) => {
    const module: Module = { id: generateId(), subjectId, name, duration, completed: false, topics };
    setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, modules: [...s.modules, module] } : s));
    return module;
  }, [setSubjects]);

  const completeModule = useCallback((subjectId: string, moduleId: string) => {
    setSubjects(prev => prev.map(s => s.id === subjectId
      ? { ...s, modules: s.modules.map(m => m.id === moduleId ? { ...m, completed: true } : m) }
      : s
    ));
  }, [setSubjects]);

  const saveQuiz = useCallback((subjectId: string, moduleId: string, quiz: Quiz) => {
    setSubjects(prev => prev.map(s => s.id === subjectId
      ? { ...s, modules: s.modules.map(m => m.id === moduleId ? { ...m, quiz } : m) }
      : s
    ));
  }, [setSubjects]);

  const deleteSubject = useCallback((id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  }, [setSubjects]);

  const deleteModule = useCallback((subjectId: string, moduleId: string) => {
    setSubjects(prev => prev.map(s => s.id === subjectId
      ? { ...s, modules: s.modules.filter(m => m.id !== moduleId) }
      : s
    ));
  }, [setSubjects]);

  return { subjects, loaded, addSubject, addModule, completeModule, saveQuiz, deleteSubject, deleteModule };
}

export function useTasks() {
  const [tasks, setTasks] = useFirestoreField<Task[]>("tasks", []);

  const addTask = useCallback((task: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = { ...task, id: generateId(), createdAt: new Date().toISOString() };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, [setTasks]);

  const completeTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: "completed" } : t));
  }, [setTasks]);

  const missTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: "missed" } : t));
  }, [setTasks]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, [setTasks]);

  const todayTasks = tasks.filter(t => t.date === new Date().toISOString().split("T")[0]);

  return { tasks, todayTasks, addTask, completeTask, missTask, deleteTask };
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useFirestoreField<WorkoutTask[]>("workouts", []);

  const addWorkout = useCallback((workout: Omit<WorkoutTask, "id">) => {
    const newWorkout: WorkoutTask = { ...workout, id: generateId() };
    setWorkouts(prev => [...prev, newWorkout]);
    return newWorkout;
  }, [setWorkouts]);

  const completeWorkout = useCallback((id: string) => {
    setWorkouts(prev => prev.map(w => w.id === id ? { ...w, completed: true } : w));
  }, [setWorkouts]);

  const deleteWorkout = useCallback((id: string) => {
    setWorkouts(prev => prev.filter(w => w.id !== id));
  }, [setWorkouts]);

  const todayWorkouts = workouts.filter(w => w.date === new Date().toISOString().split("T")[0]);

  return { workouts, todayWorkouts, addWorkout, completeWorkout, deleteWorkout };
}

export function useTargets() {
  const [targets, setTargets] = useFirestoreField<Target[]>("targets", []);

  const addTarget = useCallback((target: Omit<Target, "id" | "completed" | "penaltyAssigned" | "createdAt">) => {
    const newTarget: Target = { ...target, id: generateId(), completed: false, penaltyAssigned: false, createdAt: new Date().toISOString() };
    setTargets(prev => [...prev, newTarget]);
    return newTarget;
  }, [setTargets]);

  const updateTargetProgress = useCallback((id: string, tasksCompleted: number) => {
    setTargets(prev => prev.map(t => {
      if (t.id !== id) return t;
      const completed = tasksCompleted >= t.tasksRequired;
      return { ...t, tasksCompleted, completed };
    }));
  }, [setTargets]);

  const assignPenalty = useCallback((id: string) => {
    setTargets(prev => prev.map(t => t.id === id ? { ...t, penaltyAssigned: true } : t));
  }, [setTargets]);

  const deleteTarget = useCallback((id: string) => {
    setTargets(prev => prev.filter(t => t.id !== id));
  }, [setTargets]);

  const missedTargets = targets.filter(t => !t.completed && new Date(t.deadline) < new Date());
  const activeTargets = targets.filter(t => !t.completed && new Date(t.deadline) >= new Date());

  return { targets, activeTargets, missedTargets, addTarget, updateTargetProgress, assignPenalty, deleteTarget };
}

// Re-export useStats from original store (pure computation, no storage)
export { useStats } from "./store";