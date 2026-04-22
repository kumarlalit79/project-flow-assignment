import { ProjectModel } from "../models/project.model.js";
import { ApiResponse } from "../utils/api-response.utils.js";
import type { IProject } from "../types/index.js";
import { ProjectMemberRole, SocketEvents } from "../types/index.js";
import { getIO } from "../sockets/socket.manager.js";

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
  }).populate("members.user", "_id name email role");

  return ApiResponse.success(
    "Projects fetched successfully",
    projects.map((p) => p.toObject()),
  );
};

export const getProjectById = async (
  projectId: string,
): Promise<ApiResponse<IProject>> => {
  const project = await ProjectModel.findById(projectId)
    .populate("members.user", "_id name email role");

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
  const project = await ProjectModel.findById(projectId);

  if (!project) {
    throw Object.assign(new Error("Project not found"), {
      statusCode: 404,
    });
  }

  const memberIds = project.members.map((member) => member.user.toString());

  await ProjectModel.findByIdAndDelete(projectId);

  const io = getIO();
  io.to(`project:${projectId}`).emit(SocketEvents.PROJECT_DELETED, { projectId });
  memberIds.forEach((memberId) => {
    io.to(`user:${memberId}`).emit(SocketEvents.PROJECT_DELETED, { projectId });
  });

  return ApiResponse.success("Project deleted successfully");
};

export const addMember = async (
  projectId: string,
  userId: string,
  role: ProjectMemberRole = ProjectMemberRole.MEMBER,
): Promise<ApiResponse<IProject>> => {
  const project = await ProjectModel.findById(projectId);
  if (!project) {
    throw Object.assign(new Error("Project not found"), { statusCode: 404 });
  }

  const alreadyMember = project.members.some(
    (m) => m.user.toString() === userId,
  );
  if (alreadyMember) {
    throw Object.assign(new Error("User is already a member"), { statusCode: 400 });
  }

  project.members.push({
    user: userId as unknown as import("mongoose").Types.ObjectId,
    role,
  });
  await project.save();
  await project.populate("members.user", "_id name email role");

  const io = getIO();
  const projectData = project.toObject();
  const addedMember =
    projectData.members.find((member) => {
      const memberUser =
        typeof member.user === "string"
          ? member.user
          : member.user?._id?.toString();
      return memberUser === userId;
    }) ?? { user: userId, role };

  io.to(`project:${projectId}`).emit(SocketEvents.MEMBER_ADDED, {
    project: projectData,
    member: addedMember,
    userId,
  });

  projectData.members.forEach((member) => {
    const memberUserId =
      typeof member.user === "string"
        ? member.user
        : member.user?._id?.toString();

    if (!memberUserId) return;

    io.to(`user:${memberUserId}`).emit(SocketEvents.MEMBER_ADDED, {
      project: projectData,
      member: addedMember,
      userId,
    });
  });

  return ApiResponse.success("Member added successfully", project.toObject());
};

export const removeMember = async (
  projectId: string,
  userId: string,
): Promise<ApiResponse<IProject>> => {
  const project = await ProjectModel.findById(projectId);
  if (!project) {
    throw Object.assign(new Error("Project not found"), { statusCode: 404 });
  }

  const memberIndex = project.members.findIndex(
    (m) => m.user.toString() === userId,
  );
  if (memberIndex === -1) {
    throw Object.assign(new Error("User is not a member of this project"), {
      statusCode: 404,
    });
  }

  project.members.splice(memberIndex, 1);
  await project.save();
  await project.populate("members.user", "_id name email role");

  return ApiResponse.success("Member removed successfully", project.toObject());
};
