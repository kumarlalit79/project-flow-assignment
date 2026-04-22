import mongoose, { Schema, type Model } from "mongoose";
import type { ITask } from "../types/index.js";
import { TaskStatus, TaskPriority } from "../types/index.js";

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
    },

    priority: {
      type: String,
      enum: Object.values(TaskPriority), 
      default: TaskPriority.MEDIUM,
    },

    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true, 
    },

    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, 
  }
);


export const TaskModel: Model<ITask> =
  mongoose.models.Task ||
  mongoose.model<ITask>("Task", taskSchema);