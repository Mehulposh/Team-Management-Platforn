import mongoose from 'mongoose';

const sprintSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    goal: { type: String, maxlength: 500 },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['planning', 'active', 'completed', 'cancelled'], default: 'planning' },
    velocity: { type: Number, default: 0 }, // story points completed
    capacity: { type: Number, default: 0 }, // planned story points
    completedAt: { type: Date },
    retrospective: {
      wentWell: String,
      toImprove: String,
      actionItems: String,
    },
    // Daily burndown snapshots: { date, remaining }
    burndownData: [
      {
        date: { type: Date },
        remaining: { type: Number },
        completed: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Sprint', sprintSchema);