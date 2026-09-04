import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

export type TMessage = InferSchemaType<typeof messageSchema>;
const Message = mongoose.model('message', messageSchema);

export default Message;
