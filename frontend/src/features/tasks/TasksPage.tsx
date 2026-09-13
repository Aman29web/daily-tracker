import { useMemo, useRef, useState } from "react";
import { Plus, Search, ListTodo } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useSetTop3, useTop3 } from "./hooks";
import TaskCard from "./TaskCard";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import { todayStr } from "../../utils/date";
import { Task, TaskStatus } from "../../types";
import "./TasksPage.css";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To Do" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
];

export default function TasksPage() {
  const [search, setSearch] = useState("");
  const { data: tasks, isLoading } = useTasks({ search: search || undefined, limit: 100 });
  const create = useCreateTask();
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const setTop3 = useSetTop3();
  const { data: top3 } = useTop3(todayStr());
  const dragTaskId = useRef<string | null>(null);

  const { register, handleSubmit, reset } = useForm({ defaultValues: { title: "" } });

  const today = todayStr();
  const top3Ids = useMemo(() => new Set((top3 ?? []).map((t) => t._id)), [top3]);

  const columns = useMemo(() => {
    const byStatus: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], completed: [], cancelled: [] };
    for (const t of tasks ?? []) byStatus[t.status].push(t);
    return byStatus;
  }, [tasks]);

  const toggleTop3 = (task: Task) => {
    const isCurrentlyTop3 = task.isTop3 && task.top3Date === today;
    const nextIds = isCurrentlyTop3 ? [...top3Ids].filter((id) => id !== task._id) : [...top3Ids, task._id];
    if (nextIds.length > 3) return;
    setTop3.mutate({ date: today, taskIds: nextIds });
  };

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>Drag cards between columns to update status.</p>
        </div>
        <div className="tasks-search">
          <Search size={15} />
          <input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <form
        className="tasks-quick-add"
        onSubmit={handleSubmit(async (values) => {
          if (!values.title.trim()) return;
          await create.mutateAsync({ title: values.title, dueDate: today });
          reset();
        })}
      >
        <Plus size={16} />
        <input placeholder="Add a task and press Enter…" {...register("title", { required: true })} />
      </form>

      {isLoading ? (
        <div className="tasks-columns">
          <Skeleton height={300} radius={16} />
          <Skeleton height={300} radius={16} />
          <Skeleton height={300} radius={16} />
        </div>
      ) : (
        <div className="tasks-columns">
          {COLUMNS.map((col) => (
            <div
              key={col.status}
              className="tasks-column"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragTaskId.current) {
                  update.mutate({ id: dragTaskId.current, input: { status: col.status } });
                  dragTaskId.current = null;
                }
              }}
            >
              <div className="tasks-column-header">
                <span>{col.label}</span>
                <span className="badge badge-neutral">{columns[col.status].length}</span>
              </div>
              <div className="tasks-column-list">
                {columns[col.status].length === 0 && (
                  <EmptyState icon={ListTodo} title="Nothing here" description="Drag a task in, or add a new one above." />
                )}
                {columns[col.status].map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    isTop3Today={task.isTop3 && task.top3Date === today}
                    draggable
                    onDragStart={() => (dragTaskId.current = task._id)}
                    onToggleComplete={() =>
                      update.mutate({ id: task._id, input: { status: task.status === "completed" ? "todo" : "completed" } })
                    }
                    onToggleTop3={() => toggleTop3(task)}
                    onDelete={() => remove.mutate(task._id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
