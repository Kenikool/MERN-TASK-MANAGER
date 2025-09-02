import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreVertical } from 'lucide-react';
import KanbanCard from './KanbanCard';
import { cn } from '../../utils/cn';

const KanbanColumn = ({ column, tasks, isLoading, onCreateTask }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const getStatusIcon = (status) => {
    const icons = {
      'todo': '📋',
      'in-progress': '🔄',
      'review': '👀',
      'completed': '✅'
    };
    return icons[status] || '📋';
  };

  const getStatusColor = (status) => {
    const colors = {
      'todo': 'text-slate-600',
      'in-progress': 'text-blue-600',
      'review': 'text-yellow-600',
      'completed': 'text-green-600'
    };
    return colors[status] || 'text-slate-600';
  };

  return (
    <div className={cn(
      "flex flex-col w-80 rounded-lg transition-colors",
      column.color,
      isOver && "ring-2 ring-primary ring-opacity-50"
    )}>
      {/* Column Header */}
      <div className={cn(
        "flex justify-between items-center p-4 rounded-t-lg",
        column.headerColor
      )}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon(column.id)}</span>
          <h3 className={cn("font-semibold", getStatusColor(column.id))}>
            {column.title}
          </h3>
          <span className="badge badge-neutral badge-sm">
            {tasks.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={onCreateTask}
            className="btn btn-ghost btn-xs btn-circle"
            title="Add task"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-xs btn-circle">
              <MoreVertical className="w-4 h-4" />
            </button>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-48">
              <li><a>Sort by Priority</a></li>
              <li><a>Sort by Due Date</a></li>
              <li><a>Sort by Assignee</a></li>
              <li className="divider"></li>
              <li><a>Clear Column</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tasks Container */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-3 space-y-3 min-h-[500px] rounded-b-lg transition-colors",
          isOver && "bg-primary/5"
        )}
      >
        {isLoading ? (
          // Loading skeletons
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow-sm">
                <div className="card-body p-4">
                  <div className="skeleton h-4 w-3/4 mb-2"></div>
                  <div className="skeleton h-3 w-1/2 mb-2"></div>
                  <div className="skeleton h-3 w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <SortableContext
            items={tasks.map(task => task._id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-2">{getStatusIcon(column.id)}</div>
                <p className="text-base-content/60 text-sm mb-4">
                  No tasks in {column.title.toLowerCase()}
                </p>
                <button
                  onClick={onCreateTask}
                  className="btn btn-primary btn-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </button>
              </div>
            ) : (
              tasks.map((task) => (
                <KanbanCard key={task._id} task={task} />
              ))
            )}
          </SortableContext>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;