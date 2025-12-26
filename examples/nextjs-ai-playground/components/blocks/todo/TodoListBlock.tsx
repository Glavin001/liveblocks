"use client";

import { useMutation, useStorage } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";
import { TodoItem } from "../../../liveblocks.config";
import { nanoid } from "nanoid";
import { useState } from "react";
import { Trash2, Plus, Check, Link } from "lucide-react";
import { cn } from "../../../lib/utils";

export function TodoListBlock({ componentId, dataId }: { componentId: string, dataId?: string }) {
  const dataStores = useStorage((root) => root.dataStores);
  
  // Get the specific store if dataId is valid
  const taskStore = dataId ? dataStores.get(dataId) : null;
  const items = taskStore ? taskStore.items : null;

  const addTodo = useMutation(({ storage }, text: string) => {
    if (!dataId) return;
    const store = storage.get("dataStores").get(dataId);
    if (!store) return;

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
    store.get("items").set(id, todo);
  }, [dataId]);

  const toggleTodo = useMutation(({ storage }, id: string) => {
    if (!dataId) return;
    const store = storage.get("dataStores").get(dataId);
    if (!store) return;
    
    const todo = store.get("items").get(id);
    if (todo) {
      todo.update({ completed: !todo.get("completed") });
    }
  }, [dataId]);

  const deleteTodo = useMutation(({ storage }, id: string) => {
    if (!dataId) return;
    const store = storage.get("dataStores").get(dataId);
    if (store) {
        store.get("items").delete(id);
    }
  }, [dataId]);
  
  const updateTitle = useMutation(({ storage }, id: string, newTitle: string) => {
    if (!dataId) return;
    const store = storage.get("dataStores").get(dataId);
    if (!store) return;

    const todo = store.get("items").get(id);
    if (todo) {
        todo.update({ title: newTitle });
    }
  }, [dataId]);

  // Handle switching data source
  const switchDataSource = useMutation(({ storage }, newDataId: string) => {
    const component = storage.get("components").get(componentId);
    if (component) {
        component.update({ dataId: newDataId });
    }
  }, [componentId]);

  const [newItemText, setNewItemText] = useState("");
  const [showDataSourceSelector, setShowDataSourceSelector] = useState(false);

  const sortedTodos = Array.from(items?.values() ?? []).sort((a, b) => b.date - a.date);

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
    <div className="flex flex-col h-full bg-white p-4 overflow-hidden relative" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-bold text-gray-700 truncate flex-1">
              {taskStore.name}
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
          <div className="mb-4 p-2 bg-gray-50 rounded border border-gray-100">
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

function DataSourceSelector({ currentDataId, dataStores, onSelect }: { 
    currentDataId?: string, 
    dataStores: any, // type inference is tricky here with LiveMap
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
