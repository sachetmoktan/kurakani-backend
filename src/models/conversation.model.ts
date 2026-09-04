import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
  },
  { timestamps: true },
);

export type TConversation = InferSchemaType<typeof conversationSchema>;
const Conversation = mongoose.model('conversation', conversationSchema);

export default Conversation;
