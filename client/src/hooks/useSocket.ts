import { useEffect } from "react";
import { getSocket } from "../services/socket.service";
import { useTaskStore } from "../store/task.store";
import type { Task } from "../types";

/**
 * Subscribes to real-time task events for a project room.
 * Must be called after the socket is connected (i.e. after login).
 * Automatically joins/leaves the project room on mount/unmount.
 */
export const useSocket = (projectId: string | undefined): void => {
  const { addTask, updateTask, deleteTask } = useTaskStore();

  useEffect(() => {
    if (!projectId) return;

    const socket = getSocket();
    if (!socket) return;

    const joinProjectRoom = () => {
      socket.emit("join:project", { projectId });
    };

    if (socket.connected) {
      joinProjectRoom();
    }

    const handleTaskCreated = ({ task }: { task: Task }) => {
      addTask(task);
    };

    const handleTaskUpdated = ({ task }: { task: Task }) => {
      updateTask(task);
    };

    const handleTaskDeleted = ({ taskId }: { taskId: string }) => {
      deleteTask(taskId);
    };

    socket.on("connect", joinProjectRoom);
    socket.on("task:created", handleTaskCreated);
    socket.on("task:updated", handleTaskUpdated);
    socket.on("task:deleted", handleTaskDeleted);

    return () => {
      socket.emit("leave:project", { projectId });
      socket.off("connect", joinProjectRoom);
      socket.off("task:created", handleTaskCreated);
      socket.off("task:updated", handleTaskUpdated);
      socket.off("task:deleted", handleTaskDeleted);
    };
  }, [projectId, addTask, updateTask, deleteTask]);
};
