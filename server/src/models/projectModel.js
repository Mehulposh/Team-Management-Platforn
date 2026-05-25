import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: { 
        type: String, 
        required: true, 
        trim: true, 
        maxlength: 150 
    },
    description: { 
        type: String, 
        maxlength: 1000 
    },
    workspace: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Workspace', 
        required: true 
    },
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    members: [
      {
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
        role: { 
            type: String, 
            enum: ['project_manager', 'member', 'viewer'], 
            default: 'member' 
        },
      },
    ],
    color: { 
        type: String, 
        default: '#4f8ef7' 
    },
    icon: { 
        type: String, 
        default: 'circle-dot' 
    },
    status: { 
        type: String, 
        enum: ['active', 'on_hold', 'completed', 'archived'], 
        default: 'active' 
    },
    startDate: { 
        type: Date 
    },
    endDate: { 
        type: Date 
    },
    isArchived: { 
        type: Boolean, 
        default: false 
    },
    template: { 
        type: String, 
        enum: ['software', 'marketing', 'design', 'custom'], 
        default: 'custom' 
    },
    defaultView: { 
        type: String, 
        enum: ['board', 'list', 'calendar', 'timeline'], 
        default: 'board' 
    },
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);