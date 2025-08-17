
import KanbanBoard from "./components/KanbanBoard";
import { KanbanProvider } from "./components/KanbanContext";
import { ThemeProvider } from "./components/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle";

export default function App() {
  return (
    <ThemeProvider>
      <KanbanProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 transition-all duration-500">
          <div className="relative z-10">
            <ThemeToggle />
            <KanbanBoard />
          </div>
        </div>
      </KanbanProvider>
    </ThemeProvider>
  );
}