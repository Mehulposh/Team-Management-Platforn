import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema(
  {
    workspace: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Workspace', 
        required: true 
    },
    project: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Project', 
        default: null 
    },
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    description: { 
        type: String, 
        maxlength: 300 
    },
    type: { 
        type: String, 
        enum: ['public', 'private', 'direct'], 
        default: 'public' 
    },
    members: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    isArchived: { 
        type: Boolean, 
        default: false 
    },
    lastMessage: { 
        type: Date 
    },
  },
  { timestamps: true }
);

const messageSchema = new mongoose.Schema(
  {
    channel: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Channel', 
        required: true 
    },
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    content: { 
        type: String, 
        maxlength: 4000 
    },
    type: { 
        type: String, 
        enum: ['text', 'file', 'system'], 
        default: 'text' 
    },
    mentions: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    attachments: [
      {
        filename: String,
        url: String,
        mimetype: String,
        size: Number,
      },
    ],
    reactions: [
      {
        emoji: String,
        users: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        }],
      },
    ],
    replyTo: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Message', 
        default: null 
    },
    isEdited: { 
        type: Boolean, 
        default: false 
    },
    editedAt: { type: Date },
    isDeleted: { 
        type: Boolean, 
        default: false 
    },
  },
  { timestamps: true }
);

messageSchema.index({ channel: 1, createdAt: -1 });

const Channel = mongoose.model('Channel', channelSchema);
const Message = mongoose.model('Message', messageSchema);

export  { Channel, Message };