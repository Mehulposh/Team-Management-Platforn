import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema(
  {
    name: { 
        type: String, 
        required: true, 
        trim: true, 
        maxlength: 100 
    },
    description: { 
        type: String, 
        maxlength: 500 
    },
    slug: { 
        type: String,
        unique: true, 
        lowercase: true
    },
    logo: { 
        type: String, 
        default: '' 
    },
    color: { 
        type: String, 
        default: '#4f8ef7' 
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
            enum: ['admin', 'project_manager', 'member', 'viewer'], 
            default: 'member' 
        },
        joinedAt: { 
            type: Date, 
            default: Date.now 
        },
      },
    ],
    invites: [
      {
        email: String,
        role: { 
            type: String, 
            enum: ['admin', 'project_manager', 'member', 'viewer'], 
            default: 'member' 
        },
        token: String,
        expiresAt: Date,
        invitedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
      },
    ],
    settings: {
      isPrivate: { 
        type: Boolean, 
        default: false 
    },
      allowInvites: { 
        type: Boolean, 
        default: true 
    },
    },
    isArchived: { 
        type: Boolean, 
        default: false 
    },
  },
  { timestamps: true }
);

// Auto-generate slug from name
workspaceSchema.pre('save', async function (next) {
  if (this.isModified('name') && !this.slug) {
    let base = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    let slug = base;
    let count = 1;
    while (await mongoose.model('Workspace').findOne({ slug })) {
      slug = `${base}-${count++}`;
    }
    this.slug = slug;
  }
  next();
});

export default mongoose.model('Workspace', workspaceSchema);