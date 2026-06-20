import React, { useState } from "react";
import { Card } from "./ui/Card";
import { Plus, Check, X, Edit2, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";

type Task = {
  id: string;
  text: string;
  completed: boolean;
};

export function QuickTasks({ onTaskAdd }: { onTaskAdd?: (text: string) => void } = {}) {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Verify till at end of shift', completed: false },
    { id: '2', text: 'Clean coffee machine', completed: true },
    { id: '3', text: 'Update daily specials board', completed: false },
  ]);
  const [newTaskText, setNewTaskText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false
    };
    setTasks([...tasks, newTask]);
    setNewTaskText("");
    if (onTaskAdd) {
      onTaskAdd(newTaskText.trim());
    }
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditingText(task.text);
  };

  const saveEdit = (id: string) => {
    if (!editingText.trim()) return;
    setTasks(tasks.map(t => t.id === id ? { ...t, text: editingText.trim() } : t));
    setEditingId(null);
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg text-gray-200">Quick Tasks</h3>
          <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">Daily Checklist</p>
        </div>
        <div className="text-xs text-amber-500 font-medium px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
           {tasks.filter(t => t.completed).length}/{tasks.length} Done
        </div>
      </div>
      
      <form onSubmit={handleAddTask} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 bg-[#0B0D11] border border-gray-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-gray-200 placeholder:text-gray-600"
        />
        <button
          type="submit"
          className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-500 transition-colors flex items-center justify-center"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <ul className="space-y-3 flex-1 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
           <li className="text-center py-6 text-sm text-gray-600">No tasks remaining.</li>
        ) : tasks.map(task => (
          <li key={task.id} className={cn(
             "group flex items-center gap-3 p-3 rounded-lg border transition-all",
             task.completed ? "bg-[#0B0D11]/50 border-gray-800/50" : "bg-[#0B0D11] border-gray-800 hover:border-gray-700"
          )}>
            <button
              onClick={() => toggleTask(task.id)}
              className={cn(
                "w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors",
                task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-600 hover:border-emerald-500"
              )}
            >
              {task.completed && <Check className="w-3.5 h-3.5" />}
            </button>
            
            {editingId === task.id ? (
              <input
                type="text"
                autoFocus
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={() => saveEdit(task.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit(task.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="flex-1 bg-transparent text-sm text-gray-200 focus:outline-none focus:border-b focus:border-emerald-500 px-1"
              />
            ) : (
              <span className={cn(
                "flex-1 text-sm transition-colors cursor-pointer",
                task.completed ? "text-gray-600 line-through" : "text-gray-300"
              )} onClick={() => startEditing(task)}>
                {task.text}
              </span>
            )}

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {editingId !== task.id && (
                <>
                  <button onClick={() => startEditing(task)} className="p-1.5 text-gray-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-md transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteTask(task.id)} className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
