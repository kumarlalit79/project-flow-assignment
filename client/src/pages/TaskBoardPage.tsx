import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/axios";
import { getSocket } from "../services/socket.service";
import { useAuthStore } from "../store/auth.store";

type Task = {
  _id: string;
  title: string;
  description: string;
  status: "todo" | "inProgress" | "done";
};

const columns = ["todo", "inProgress", "done"] as const;

export default function TaskBoardPage() {
  const { id } = useParams();
  const { user } = useAuthStore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = user?.role === "admin";

  // 🔹 Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get(`/projects/${id}/tasks`);
        setTasks(res.data.data);
      } catch {
        setError("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [id]);

  // 🔹 SOCKET REAL-TIME
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("join:project", { projectId: id });

    socket.on("task:created", ({ task }) => {
      setTasks((prev) => [...prev, task]);
    });

    socket.on("task:updated", ({ task }) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? task : t))
      );
    });

    socket.on("task:deleted", ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    });

    return () => {
      socket.off("task:created");
      socket.off("task:updated");
      socket.off("task:deleted");
    };
  }, [id]);

  // 🔹 Create Task
  const createTask = async () => {
    if (!title) return;

    try {
      await api.post(`/projects/${id}/tasks`, {
        title,
        description: "New task",
      });
      setTitle("");
    } catch {
      setError("Failed to create task");
    }
  };

  // 🔹 Move Task
  const moveTask = async (taskId: string, status: Task["status"]) => {
    try {
      await api.patch(`/projects/${id}/tasks/${taskId}/status`, {
        status,
      });
    } catch {
      setError("Failed to update task");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      {/* ERROR */}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* CREATE TASK */}
      {isAdmin && (
        <div className="mb-4 flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New task"
            className="border p-2"
          />
          <button onClick={createTask} className="bg-black text-white px-3">
            Add
          </button>
        </div>
      )}

      {/* BOARD */}
      <div className="grid grid-cols-3 gap-4">
        {columns.map((col) => (
          <div key={col} className="border p-4 rounded">
            <h2 className="font-bold mb-3 capitalize">{col}</h2>

            {tasks
              .filter((t) => t.status === col)
              .map((task) => (
                <div key={task._id} className="border p-2 mb-2 rounded">
                  <p>{task.title}</p>

                  <div className="flex gap-1 mt-2 flex-wrap">
                    {columns.map((c) => (
                      <button
                        key={c}
                        onClick={() => moveTask(task._id, c)}
                        className="text-xs border px-2"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}