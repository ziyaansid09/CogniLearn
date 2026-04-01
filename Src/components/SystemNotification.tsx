import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  show: boolean;
  title: string;
  message: string;
  type?: "warning" | "error" | "success";
  onClose: () => void;
}

export default function SystemNotification({ show, title, message, type = "error", onClose }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          className="fixed top-6 right-6 z-[100] max-w-sm"
        >
          <div className={`system-notification ${
            type === "success" ? "border-success/50" : type === "warning" ? "border-warning/50" : ""
          }`}>
            <button onClick={onClose} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-6 h-6 flex-shrink-0 ${
                type === "success" ? "text-success" : type === "warning" ? "text-warning" : "text-destructive"
              }`} />
              <div>
                <h4 className="font-display text-sm font-bold text-foreground">{title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{message}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}