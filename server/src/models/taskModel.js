import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
},
  isCompleted: { 
    type: Boolean, 
    default: false 
},
  completedAt: { type: Date },
  completedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
},
}, { timestamps: true });

const activitySchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
},
  action: { 
    // 'created', 'moved', 'assigned', 'commented', etc.
    type: String, 
    required: true 
}, 
  field: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  message: String,
}, { timestamps: true });

const taskSchema = new mongoose.Schema(
  {
    title: { 
        type: String, 
        required: true, 
        trim: true, 
        maxlength: 300 
    },
    description: { 
        type: String, 
        maxlength: 5000, 
        default: '' 
    },
    project: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Project', 
        required: true 
    },
    workspace: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Workspace', 
        required: true 
    },
    board: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Board', 
        required: true 
    },
    columnId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
    },
    sprint: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Sprint', 
        default: null 
    },
    order: { 
        type: Number, 
        default: 0 
    }, // position within column
    creator: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    assignees: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    priority: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'urgent'], 
        default: 'medium' 
    },
    status: { 
        type: String, 
        enum: ['todo', 'in_progress', 'review', 'done'], 
        default: 'todo' 
    },
    labels: [
      {
        name: String,
        color: String,
      },
    ],
    dueDate: { type: Date },
    startDate: { type: Date },
    estimatedHours: { 
        type: Number, 
        default: 0 
    },
    loggedHours: { 
        type: Number, 
        default: 0 
    },
    storyPoints: { 
        type: Number, 
        default: 0 
    },
    subtasks: [subtaskSchema],
    attachments: [
      {
        filename: String,
        url: String,
        publicId: String,
        mimetype: String,
        size: Number,
        uploadedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
        uploadedAt: { 
            type: Date, 
            default: Date.now 
        },
      },
    ],
    activity: [activitySchema],
    watchers: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    isArchived: { 
        type: Boolean, 
        default: false 
    },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Index for fast board queries
taskSchema.index({ board: 1, columnId: 1, order: 1 });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignees: 1, dueDate: 1 });
taskSchema.index({ sprint: 1 });

// Virtual: completion percentage via subtasks
taskSchema.virtual('completionPercent').get(function () {
  if (!this.subtasks.length) return 0;
  const done = this.subtasks.filter(s => s.isCompleted).length;
  return Math.round((done / this.subtasks.length) * 100);
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

export default mongoose.model('Task', taskSchema);