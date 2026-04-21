import mongoose, { Schema, type Model } from "mongoose";
import bcrypt from "bcryptjs";
import type { IUser } from "../types/index.ts";
import { UserRole } from "../types/index.ts";

interface IUserDocument extends IUser {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true, 
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.MEMBER,
    },
  },
  {
    timestamps: true, 
  }
);


userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserModel: Model<IUserDocument> =
  mongoose.models.User ||
  mongoose.model<IUserDocument>("User", userSchema);