import mongoose from 'mongoose';

const projectMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

export const DEFAULT_ROLE_PERMISSIONS = {
  admin: {
    viewTasks: true,
    createTasks: true,
    editTasks: true,
    deleteTasks: true,
    moveTasks: true,
    createComments: true,
    deleteComments: true,
    manageBoards: true,
    inviteMembers: true,
  },
  member: {
    viewTasks: true,
    createTasks: true,
    editTasks: true,
    deleteTasks: false,
    moveTasks: true,
    createComments: true,
    deleteComments: false,
    manageBoards: false,
    inviteMembers: false,
  },
  viewer: {
    viewTasks: true,
    createTasks: false,
    editTasks: false,
    deleteTasks: false,
    moveTasks: false,
    createComments: true,
    deleteComments: false,
    manageBoards: false,
    inviteMembers: false,
  },
};

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    key: {
      type: String,
      uppercase: true,
      trim: true,
      default: function () {
        return this.name ? this.name.substring(0, 3).toUpperCase() : 'PRJ';
      },
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    color: {
      type: String,
      default: '#6366f1', // Indigo accent
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [projectMemberSchema],
    rolePermissions: {
      type: Object,
      default: () => JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS)),
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
projectSchema.index({ 'members.user': 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
