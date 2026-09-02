import mongoose, { type InferSchemaType } from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      minlength: [3, 'Name must be at least 10 characters long'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export type TUser = InferSchemaType<typeof userSchema>;
const User = mongoose.model('user', userSchema);

export default User;
