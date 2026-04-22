import { UserModel } from "../models/user.model.ts";
import { generateToken } from "../utils/jwt.utils.ts";
import { ApiResponse } from "../utils/api-response.utils.ts";
import type { IUser } from "../types/index.ts";
import { UserRole } from "../types/index.ts";

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
}): Promise<ApiResponse<IUser>> => {
  const { name, email, password } = data;

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    throw Object.assign(new Error("User already exists"), {
      statusCode: 400,
    });
  }

  const userCount = await UserModel.countDocuments();
  const role = userCount === 0 ? UserRole.ADMIN : UserRole.MEMBER;

  const user = await UserModel.create({
    name,
    email,
    password,
    role,
  });

  const token = generateToken({
    userId: user._id.toString(),
    role: user.role,
  });

  const { password: _pwd, ...safeUser } = user.toObject();
  return ApiResponse.success("User registered successfully", {
    ...safeUser,
    token,
  } as unknown as IUser);
};

export const loginUser = async (data: {
  email: string;
  password: string;
}): Promise<ApiResponse<IUser>> => {
  const { email, password } = data;

  const user = await UserModel.findOne({ email });
  if (!user) {
    throw Object.assign(new Error("Invalid credentials"), {
      statusCode: 401,
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw Object.assign(new Error("Invalid credentials"), {
      statusCode: 401,
    });
  }

  const token = generateToken({
    userId: user._id.toString(),
    role: user.role,
  });

  const { password: _pwd2, ...safeLoginUser } = user.toObject();
  return ApiResponse.success("Login successful", {
    ...safeLoginUser,
    token,
  } as unknown as IUser);
};

export const getMe = async (userId: string): Promise<ApiResponse<IUser>> => {
  const user = await UserModel.findById(userId).select("-password");

  if (!user) {
    throw Object.assign(new Error("User not found"), {
      statusCode: 404,
    });
  }

  return ApiResponse.success("User fetched successfully", user.toObject());
};
