"use client";

import { useMutation, useStorage } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";
import { TodoItem } from "../../../liveblocks.config";
import { nanoid } from "nanoid";
import { useState } from "react";
import { Trash2, Plus, Check } from "lucide-react";
import { cn } from "../../../lib/utils";

export function TodoListBlock({ componentId }: { componentId: string }) {
  const todos = useStorage((root) => root.todos);

  const addTodo = useMutation(({ storage }, text: string) => {
    const id = nanoid();
    // Default to start of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todo = new LiveObject<TodoItem>({
      id,
      title: text,
      completed: false,
      date: today.getTime(),
      color: "#3b82f6", // default blue
    });
    storage.get("todos").set(id, todo);
  }, []);

  const toggleTodo = useMutation(({ storage }, id: string) => {
    const todo = storage.get("todos").get(id);
    if (todo) {
      todo.update({ completed: !todo.get("completed") });
    }
  }, []);

  const deleteTodo = useMutation(({ storage }, id: string) => {
    storage.get("todos").delete(id);
  }, []);
  
  const updateTitle = useMutation(({ storage }, id: string, newTitle: string) => {
      const todo = storage.get("todos").get(id);
      if (todo) {
          todo.update({ title: newTitle });
      }
  }, []);

  const [newItemText, setNewItemText] = useState("");

  const sortedTodos = Array.from(todos?.values() ?? []).sort((a, b) => b.date - a.date);

  return (
    <div className="flex flex-col h-full bg-white p-4 overflow-hidden relative" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 border rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add a task..."
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newItemText.trim()) {
              addTodo(newItemText);
              setNewItemText("");
            }
          }}
        />
        <button
          className="bg-blue-500 text-white p-1.5 rounded hover:bg-blue-600"
          onClick={() => {
            if (newItemText.trim()) {
              addTodo(newItemText);
              setNewItemText("");
            }
          }}
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {sortedTodos.map((todo) => (
          <div key={todo.id} className="flex items-center gap-2 group p-1 hover:bg-gray-50 rounded">
             <button
              onClick={() => toggleTodo(todo.id)}
              className={cn(
                "w-5 h-5 border rounded flex items-center justify-center transition-colors shrink-0",
                todo.completed ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-gray-400"
              )}
            >
              {todo.completed && <Check size={12} />}
            </button>
            <input 
                value={todo.title}
                onChange={(e) => updateTitle(todo.id, e.target.value)}
                className={cn(
                    "flex-1 text-sm bg-transparent outline-none border-b border-transparent focus:border-blue-500 px-1 truncate",
                     todo.completed && "line-through text-gray-400"
                )}
            />
            <div className="text-xs text-gray-400 shrink-0">
                {new Date(todo.date).toLocaleDateString()}
            </div>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {sortedTodos.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-8">
                No tasks yet. Add one above!
            </div>
        )}
      </div>
    </div>
  );
}
