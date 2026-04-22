import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import { useProjectStore } from "../store/project.store";
import type { Project, ApiResponse } from "../types";

export const useProjects = () => {
  const { setProjects } = useProjectStore();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Project[]>>("/projects");
      const projects = res.data.data ?? [];
      setProjects(projects);
      return projects;
    },
  });

  const createProject = useMutation({
    mutationFn: async (payload: { name: string; description: string }) => {
      const res = await api.post<ApiResponse<Project>>("/projects", payload);
      return res.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const addMember = useMutation({
    mutationFn: async ({
      projectId,
      userId,
      role,
    }: {
      projectId: string;
      userId: string;
      role?: "manager" | "member";
    }) => {
      const res = await api.post<ApiResponse<Project>>(
        `/projects/${projectId}/members`,
        { userId, role }
      );
      return res.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const removeMember = useMutation({
    mutationFn: async ({
      projectId,
      userId,
    }: {
      projectId: string;
      userId: string;
    }) => {
      const res = await api.delete<ApiResponse<Project>>(
        `/projects/${projectId}/members/${userId}`
      );
      return res.data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  return {
    projects: data ?? [],
    isLoading,
    error,
    createProject,
    addMember,
    removeMember,
  };
};
