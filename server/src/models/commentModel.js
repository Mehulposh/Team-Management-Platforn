import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    task: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Task', 
        required: true 
    },
    author: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    content: { 
        type: String, 
        required: true, 
        maxlength: 3000 
    },
    mentions: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    attachments: [
      {
        filename: String,
        url: String,
        publicId: String,
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
    isEdited: { 
        type: Boolean, 
        default: false 
    },
    editedAt: { 
        type: Date 
    },
    parentComment: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comment', 
        default: null 
    },
  },
  { timestamps: true }
);

commentSchema.index({ task: 1, createdAt: 1 });

export default mongoose.model('Comment', commentSchema);