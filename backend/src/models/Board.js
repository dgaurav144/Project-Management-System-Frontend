import mongoose from 'mongoose';

const columnSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: '#94a3b8',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const defaultColumns = [
  { id: 'col-todo', name: 'To Do', key: 'todo', color: '#64748b', order: 0 },
  { id: 'col-inprogress', name: 'In Progress', key: 'in-progress', color: '#3b82f6', order: 1 },
  { id: 'col-review', name: 'In Review', key: 'review', color: '#f59e0b', order: 2 },
  { id: 'col-done', name: 'Done', key: 'done', color: '#10b981', order: 3 },
];

const boardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Board name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    columns: {
      type: [columnSchema],
      default: defaultColumns,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Board = mongoose.model('Board', boardSchema);
export default Board;
