import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },    
    type: {
      type: String,
      enum: [
        'task_assigned',
        'task_mentioned',
        'task_commented',
        'task_completed',
        'task_due_soon',
        'task_overdue',
        'sprint_started',
        'sprint_ended',
        'workspace_invite',
        'project_added',
      ],
      required: true,
    },
    title: { 
        type: String, 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    link: { 
        // frontend route
        type: String 
    }, 
    isRead: { 
        type: Boolean, 
        default: false 
    },
    readAt: { 
        type: Date 
    },
    // Related entities
    workspace: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Workspace' 
    },
    project: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Project' 
    },
    task: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Task' 
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);