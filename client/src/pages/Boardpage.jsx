import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useBoardStore } from '../zustand/boardStore.js';
import { useSocket } from '../socket/UseSocket.js';
import TaskCard from '../components/TaskCard.jsx';
import TaskDetailModal from '../components/TaskDetailModal.jsx';
import CreateTaskModal from '../components/CreateTaskModal.jsx';
import { useWorkspaceStore } from '../zustand/workspaceStore.js';
import toast from 'react-hot-toast';

function Column({ column, tasks, onAddTask }) {
  const { setNodeRef } = useDroppable({ id: column._id });

  return (
    <div className="min-w-[272px] w-[272px] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-t-xl bg-surface2 border border-border border-b-0">
        <span className="w-2 h-2 rounded-full" style={{ background: column.color }} />
        <span className="text-xs font-semibold flex-1">{column.name}</span>
        <span className="text-[10px] text-muted bg-surface3 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex-1 bg-surface border border-border border-t-0 rounded-b-xl p-2 flex flex-col gap-2 min-h-[200px]"
      >
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task._id} task={task} />
          ))}
        </SortableContext>

        <button
          onClick={() => onAddTask(column._id)}
          className="flex items-center gap-2 p-2 rounded-lg text-muted hover:text-white hover:bg-surface2 border border-dashed border-border text-xs transition-all mt-1"
        >
          <i className="ti ti-plus text-sm" /> Add card
        </button>
      </div>
    </div>
  );
}

function SortableTaskCard({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
  const { setSelectedTask } = useBoardStore();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={() => setSelectedTask(task)} />
    </div>
  );
}

export default function BoardPage() {
  const { projectId } = useParams();
  const { board, columns, tasksByColumn, isLoading, fetchBoard, moveTask, selectedTask, setSelectedTask } = useBoardStore();
  const { activeProject } = useWorkspaceStore();
  const [createColumn, setCreateColumn] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [activeTask, setActiveTask] = useState(null);

  useSocket(projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    if (projectId) fetchBoard(projectId);
  }, [projectId]);

  const findColumnForTask = (taskId) => {
    for (const [colId, tasks] of Object.entries(tasksByColumn)) {
      if (tasks.find((t) => t._id === taskId)) return colId;
    }
    return null;
  };

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
    const colId = findColumnForTask(active.id);
    if (colId) {
      const task = tasksByColumn[colId]?.find((t) => t._id === active.id);
      setActiveTask(task);
    }
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    setActiveTask(null);
    if (!over) return;

    const fromColumn = findColumnForTask(active.id);
    let toColumn = over.id;

    // If dropped on a task, find its column
    const toColByTask = findColumnForTask(over.id);
    if (toColByTask) toColumn = toColByTask;

    const toTasks = tasksByColumn[toColumn] || [];
    const newIndex = toColByTask
      ? toTasks.findIndex((t) => t._id === over.id)
      : toTasks.length;

    if (fromColumn && toColumn) {
      moveTask({ taskId: active.id, fromColumnId: fromColumn, toColumnId: toColumn, newIndex });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <i className="ti ti-loader-2 animate-spin text-2xl text-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-surface flex-shrink-0">
        <h1 className="font-semibold text-sm">{activeProject?.name || 'Board'}</h1>
        <div className="flex gap-1">
          {['All', 'High Priority', 'My Tasks', 'Overdue'].map((f) => (
            <button key={f} className="text-xs px-2.5 py-1 rounded-full border border-border text-muted hover:text-white hover:border-border2 transition-all">
              {f}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setCreateColumn(board?._id)}
            className="btn-secondary text-xs py-1.5"
          >
            <i className="ti ti-plus" /> Add Column
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 p-5 h-full items-start">
            {columns.map((col) => (
              <Column
                key={col._id}
                column={col}
                tasks={tasksByColumn[col._id] || []}
                onAddTask={(colId) => setCreateColumn({ colId, boardId: board._id })}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modals */}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
      {createColumn?.colId && (
        <CreateTaskModal
          columnId={createColumn.colId}
          boardId={board._id}
          projectId={projectId}
          workspaceId={activeProject?.workspace}
          onClose={() => setCreateColumn(null)}
        />
      )}
    </div>
  );
}