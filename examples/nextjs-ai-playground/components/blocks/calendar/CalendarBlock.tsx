"use client";

import { useMutation, useStorage } from "@liveblocks/react/suspense";
import { cn } from "../../../lib/utils";
import { useState } from "react";
import React from "react";

export function CalendarBlock({ componentId }: { componentId: string }) {
  const todos = useStorage((root) => root.todos);
  const updateTodoDate = useMutation(({ storage }, id: string, newDate: number) => {
    const todo = storage.get("todos").get(id);
    if (todo) {
      todo.update({ date: newDate });
    }
  }, []);

  // Simple view: 5-day rolling window starting from "Today".
  // In a real app, this would be scrollable or have navigation.
  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);
  
  const days = Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(startOfToday);
      d.setDate(d.getDate() + i);
      return d;
  });

  const getTodosForDay = (date: Date) => {
      if (!todos) return [];
      const start = date.getTime();
      const end = start + 86400000;
      return Array.from(todos.values()).filter(t => t.date >= start && t.date < end);
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
      e.preventDefault();
      const todoId = e.dataTransfer.getData("text/plain");
      if (todoId) {
          updateTodoDate(todoId, date.getTime());
      }
      setIsDragOver(null);
  };

  const [isDragOver, setIsDragOver] = useState<number | null>(null);

  return (
      <div className="flex flex-col h-full bg-white overflow-hidden" onPointerDown={(e) => e.stopPropagation()}>
          <div className="p-2 border-b text-sm font-semibold text-gray-700 bg-gray-50 flex justify-between items-center">
             <span>Calendar View</span>
             <span className="text-xs font-normal text-gray-500">Drag tasks to reschedule</span>
          </div>
          <div className="flex-1 flex overflow-x-auto divide-x divide-gray-100">
              {days.map((day, i) => (
                  <div 
                    key={day.toISOString()} 
                    className={cn(
                        "min-w-[100px] flex-1 flex flex-col p-2 transition-colors",
                        isDragOver === day.getTime() ? "bg-blue-50" : "bg-white"
                    )}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(day.getTime());
                    }}
                    onDragLeave={() => setIsDragOver(null)}
                    onDrop={(e) => handleDrop(e, day)}
                  >
                      <div className={cn(
                          "text-center font-semibold text-xs mb-2 uppercase rounded py-1",
                           i === 0 ? "bg-blue-100 text-blue-700" : "text-gray-500"
                      )}>
                          {day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-1 space-y-2 overflow-y-auto">
                          {getTodosForDay(day).map(todo => (
                              <div 
                                key={todo.id}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData("text/plain", todo.id);
                                }}
                                className={cn(
                                    "p-2 rounded text-xs shadow-sm cursor-grab active:cursor-grabbing border-l-2 bg-white border border-gray-100 select-none",
                                    todo.completed ? "border-green-500 opacity-60 line-through" : "border-blue-500"
                                )}
                              >
                                  {todo.title}
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );
}
