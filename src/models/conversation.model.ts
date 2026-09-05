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
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },

    lastMessageDetail: {
      content: {
        type: String,
        default: '',
      },
      senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },

      createdAt: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true },
);

export type TConversation = InferSchemaType<typeof conversationSchema>;
const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
