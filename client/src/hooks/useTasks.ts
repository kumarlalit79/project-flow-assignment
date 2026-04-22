import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import { useTaskStore } from "../store/task.store";
import type { Task, ApiResponse } from "../types";

export const useTasks = (projectId: string | undefined) => {
  const { setTasks } = useTaskStore();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Task[]>>(
        `/projects/${projectId}/tasks`
      );
      const tasks = res.data.data ?? [];
      setTasks(tasks);
      return tasks;
    },
    enabled: !!projectId,
  });

  const createTask = useMutation({
    mutationFn: async (payload: { title: string; description: string }) => {
      const res = await api.post<ApiResponse<Task>>(
        `/projects/${projectId}/tasks`,
        payload
      );
      return res.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({
      taskId,
      data,
    }: {
      taskId: string;
      data: Partial<Pick<Task, "title" | "description" | "priority" | "assignee" | "dueDate">>;
    }) => {
      const res = await api.patch<ApiResponse<Task>>(
        `/projects/${projectId}/tasks/${taskId}`,
        data
      );
      return res.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({
      taskId,
      status,
    }: {
      taskId: string;
      status: Task["status"];
    }) => {
      const res = await api.patch<ApiResponse<Task>>(
        `/projects/${projectId}/tasks/${taskId}/status`,
        { status }
      );
      return res.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  return {
    tasks: data ?? [],
    isLoading,
    error,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  };
};
