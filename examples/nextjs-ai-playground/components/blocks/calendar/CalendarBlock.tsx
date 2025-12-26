"use client";

import { useMutation, useStorage } from "@liveblocks/react/suspense";
import { cn } from "../../../lib/utils";
import { useState } from "react";
import React from "react";
import { Link } from "lucide-react";

export function CalendarBlock({ componentId, dataId }: { componentId: string, dataId?: string }) {
  const dataStores = useStorage((root) => root.dataStores);
  
  // Get the specific store if dataId is valid
  const taskStore = dataId ? dataStores.get(dataId) : null;
  const items = taskStore ? taskStore.items : null;

  const updateTodoDate = useMutation(({ storage }, id: string, newDate: number) => {
    if (!dataId) return;
    const store = storage.get("dataStores").get(dataId);
    if (!store) return;
    
    const todo = store.get("items").get(id);
    if (todo) {
      todo.update({ date: newDate });
    }
  }, [dataId]);

  const switchDataSource = useMutation(({ storage }, newDataId: string) => {
    const component = storage.get("components").get(componentId);
    if (component) {
        component.update({ dataId: newDataId });
    }
  }, [componentId]);

  const [showDataSourceSelector, setShowDataSourceSelector] = useState(false);

  // Simple view: 5-day rolling window starting from "Today".
  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);
  
  const days = Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(startOfToday);
      d.setDate(d.getDate() + i);
      return d;
  });

  const getTodosForDay = (date: Date) => {
      if (!items) return [];
      const start = date.getTime();
      const end = start + 86400000;
      return Array.from(items.values()).filter(t => t.date >= start && t.date < end);
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

  if (!dataId || !taskStore) {
    return (
        <div className="flex flex-col h-full bg-white p-4 items-center justify-center text-center">
           <p className="text-gray-400 text-sm mb-4">No data source connected.</p>
           <DataSourceSelector 
             currentDataId={dataId} 
             dataStores={dataStores} 
             onSelect={switchDataSource}
          />
        </div>
    );
  }

  return (
      <div className="flex flex-col h-full bg-white overflow-hidden" onPointerDown={(e) => e.stopPropagation()}>
          <div className="p-2 border-b text-sm font-semibold text-gray-700 bg-gray-50 flex justify-between items-center shrink-0">
             <div className="flex flex-col">
                <span>{taskStore.name}</span>
                <span className="text-xs font-normal text-gray-500">Drag to reschedule</span>
             </div>
             <button 
                className="p-1 hover:bg-gray-100 rounded text-gray-400"
                onClick={() => setShowDataSourceSelector(!showDataSourceSelector)}
                title="Switch Data Source"
              >
                  <Link size={14} />
              </button>
          </div>
          
          {showDataSourceSelector && (
              <div className="p-2 bg-gray-50 border-b border-gray-100 shrink-0">
                 <DataSourceSelector 
                   currentDataId={dataId} 
                   dataStores={dataStores} 
                   onSelect={(id) => {
                       switchDataSource(id);
                       setShowDataSourceSelector(false);
                   }}
                />
              </div>
          )}

          <div className="flex-1 flex overflow-x-auto divide-x divide-gray-100 min-h-0">
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

function DataSourceSelector({ currentDataId, dataStores, onSelect }: { 
    currentDataId?: string, 
    dataStores: any, 
    onSelect: (id: string) => void 
}) {
    const stores = Array.from(dataStores.entries()) as [string, any][];
    
    return (
        <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-500 uppercase">Select Data Source</div>
            {stores.map(([id, store]) => (
                <button
                  key={id}
                  onClick={() => onSelect(id)}
                  className={cn(
                      "w-full text-left px-2 py-1 text-sm rounded hover:bg-blue-50 transition-colors flex items-center gap-2",
                      currentDataId === id ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600"
                  )}
                >
                    <div className={cn("w-2 h-2 rounded-full", currentDataId === id ? "bg-blue-500" : "bg-gray-300")} />
                    {store.name}
                </button>
            ))}
            {stores.length === 0 && <div className="text-xs text-gray-400 italic">No data sources available</div>}
        </div>
    );
}
