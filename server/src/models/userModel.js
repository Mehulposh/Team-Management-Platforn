import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { 
        type: String, 
        required: true, 
        trim: true, 
        maxlength: 100 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    password: { 
        type: String, 
        minlength: 6, 
        select: false 
    },
    googleId: { 
        type: String, 
        unique: true, 
        sparse: true 
    },
    avatar: { 
        type: String, 
        default: '' 
    },
    role: { 
        type: String, 
        enum: ['admin', 'user'], 
        default: 'user' 
    },
    isEmailVerified: { 
        type: Boolean, 
        default: false 
    },
    emailVerificationToken: { 
        type: String, 
        select: false 
    },
    emailVerificationExpire: { 
        type: Date, 
        select: false 
    },
    passwordResetToken: { 
        type: String, 
        select: false 
    },
    passwordResetExpire: { 
        type: Date, 
        select: false 
    },
    refreshToken: { 
        type: String, 
        select: false 
    },
    lastSeen: { 
        type: Date, 
        default: Date.now 
    },
    isOnline: { 
        type: Boolean, 
        default: false 
    },
    preferences: {
      theme: { 
        type: String, 
        enum: ['dark', 'light', 'system'], 
        default: 'dark' 
    },
      notifications: {
        email: { 
            type: Boolean, 
            default: true 
        },
        push: { 
            type: Boolean, 
            default: true 
        },
        taskAssigned: { 
            type: Boolean, 
            default: true 
        },
        mentioned: { 
            type: Boolean, 
            default: true 
        },
        deadlineReminder: { 
            type: Boolean, 
            default: true 
        },
      },
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function () {
   // Skip if no password exists
  if (!this.password) {
    return 
  }

  // Skip if password wasn't modified
  if (!this.isModified('password')) {
    return 
  }

  this.password = await bcrypt.hash(this.password, 12);

  
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  return obj;
};

export default mongoose.model('User', userSchema);