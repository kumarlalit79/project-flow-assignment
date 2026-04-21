import { ProjectModel } from "../models/project.model.ts";
import { ApiResponse } from "../utils/api-response.utils.ts";
import type { IProject } from "../types/index.ts";
import { ProjectMemberRole } from "../types/index.ts";

export const createProject = async (data: {
  name: string;
  description: string;
  userId: string;
}): Promise<ApiResponse<IProject>> => {
  const { name, description, userId } = data;

  const project = await ProjectModel.create({
    name,
    description,
    createdBy: userId,
    members: [
      {
        user: userId,
        role: ProjectMemberRole.MANAGER,
      },
    ],
  });

  return ApiResponse.success(
    "Project created successfully",
    project.toObject(),
  );
};

export const getProjects = async (
  userId: string,
): Promise<ApiResponse<IProject[]>> => {
  const projects = await ProjectModel.find({
    "members.user": userId,
  });

  return ApiResponse.success(
    "Projects fetched successfully",
    projects.map((p) => p.toObject()),
  );
};

export const getProjectById = async (
  projectId: string,
): Promise<ApiResponse<IProject>> => {
  const project = await ProjectModel.findById(projectId);

  if (!project) {
    throw Object.assign(new Error("Project not found"), {
      statusCode: 404,
    });
  }

  return ApiResponse.success(
    "Project fetched successfully",
    project.toObject(),
  );
};

export const updateProject = async (
  projectId: string,
  data: { name?: string; description?: string },
): Promise<ApiResponse<IProject>> => {
  const project = await ProjectModel.findByIdAndUpdate(projectId, data, {
    new: true,
  });

  if (!project) {
    throw Object.assign(new Error("Project not found"), {
      statusCode: 404,
    });
  }

  return ApiResponse.success(
    "Project updated successfully",
    project.toObject(),
  );
};

export const deleteProject = async (
  projectId: string,
): Promise<ApiResponse<null>> => {
  const project = await ProjectModel.findByIdAndDelete(projectId);

  if (!project) {
    throw Object.assign(new Error("Project not found"), {
      statusCode: 404,
    });
  }

  return ApiResponse.success("Project deleted successfully");
};
