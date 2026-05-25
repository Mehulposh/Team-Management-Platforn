import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema(
  {
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
    columns: [
      {
        _id: { 
            type: mongoose.Schema.Types.ObjectId, 
            auto: true 
        },
        name: { 
            type: String, 
            required: true 
        },
        color: { 
            type: String, 
            default: '#6b7590' 
        },
        order: { 
            type: Number, 
            required: true 
        },
        isDefault: { 
            type: Boolean, 
            default: false 
        },
        wipLimit: { 
            type: Number, 
            default: null 
        }, // work-in-progress limit
      },
    ],
    settings: {
      showSubtasks: { 
        type: Boolean, 
        default: true 
    },
      groupBy: { 
        type: String, 
        enum: ['status', 'assignee', 'priority', 'label'], 
        default: 'status' 
    },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Board', boardSchema);