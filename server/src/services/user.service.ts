import { UserModel } from "../models/user.model.js";
import { ApiResponse } from "../utils/api-response.utils.js";
import type { IUser } from "../types/index.js";
import { UserRole } from "../types/index.js";

export const getAllUsers = async (): Promise<ApiResponse<IUser[]>> => {
  const users = await UserModel.find().select("-password");

  return ApiResponse.success(
    "Users fetched successfully",
    users.map((u) => u.toObject())
  );
};

export const updateUserRole = async (
  userId: string,
  role: UserRole
): Promise<ApiResponse<IUser>> => {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { role },
    { new: true }
  ).select("-password");

  if (!user) {
    throw Object.assign(new Error("User not found"), {
      statusCode: 404,
    });
  }

  return ApiResponse.success(
    "User role updated successfully",
    user.toObject()
  );
};