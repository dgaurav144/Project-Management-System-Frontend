import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Please enter your full name',
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email address cannot be empty',
    'string.email': 'Please enter a valid email address (e.g. name@example.com)',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password cannot be empty',
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
  role: Joi.string().valid('admin', 'user').default('user'),
  avatar: Joi.string().uri().optional().allow(''),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Please enter your email address',
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required to sign in',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Please enter your password',
    'any.required': 'Password is required to sign in',
  }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token is missing',
    'any.required': 'Refresh token is required',
  }),
});

export const createProjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Project name cannot be empty',
    'string.min': 'Project name must be at least 2 characters',
    'any.required': 'Project name is required',
  }),
  description: Joi.string().max(500).allow('').optional(),
  key: Joi.string().alphanum().min(2).max(10).uppercase().optional().messages({
    'string.alphanum': 'Project key must contain only letters and numbers',
    'string.min': 'Project key must be at least 2 characters',
  }),
  color: Joi.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional().messages({
    'string.pattern.base': 'Please select a valid hex color format',
  }),
});

export const updateProjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Project name must be at least 2 characters',
  }),
  description: Joi.string().max(500).allow('').optional(),
  status: Joi.string().valid('active', 'completed', 'archived').optional(),
  color: Joi.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
});

export const inviteMemberSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Please enter teammate email address',
    'string.email': 'Please provide a valid email address to invite',
    'any.required': 'Email is required for sending invitations',
  }),
  role: Joi.string().valid('admin', 'member', 'viewer').default('member'),
});

export const updateMemberRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'member', 'viewer').required().messages({
    'any.only': 'Role must be admin, member, or viewer',
    'any.required': 'Role is required',
  }),
});

export const createBoardSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Board name cannot be empty',
    'string.min': 'Board name must be at least 2 characters',
    'any.required': 'Board name is required',
  }),
  description: Joi.string().max(300).allow('').optional(),
});

export const updateBoardSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Board name must be at least 2 characters',
  }),
  description: Joi.string().max(300).allow('').optional(),
  columns: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      key: Joi.string().required(),
      color: Joi.string().optional(),
      order: Joi.number().optional(),
    })
  ).optional(),
});

export const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    'string.empty': 'Task title cannot be empty',
    'string.min': 'Task title cannot be empty',
    'any.required': 'Task title is required',
  }),
  description: Joi.string().max(3000).allow('').optional(),
  status: Joi.string().valid('todo', 'in-progress', 'review', 'done').default('todo'),
  columnId: Joi.string().optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  dueDate: Joi.date().iso().allow(null).optional().messages({
    'date.format': 'Please provide a valid ISO due date format',
  }),
  assignees: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  subtasks: Joi.array().items(
    Joi.object({
      title: Joi.string().required().messages({
        'string.empty': 'Subtask title cannot be empty',
      }),
      completed: Joi.boolean().default(false),
    })
  ).optional(),
  estimatedHours: Joi.number().min(0).optional(),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional().messages({
    'string.empty': 'Task title cannot be empty',
  }),
  description: Joi.string().max(3000).allow('').optional(),
  status: Joi.string().valid('todo', 'in-progress', 'review', 'done').optional(),
  columnId: Joi.string().optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  assignees: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  subtasks: Joi.array().items(
    Joi.object({
      _id: Joi.string().optional(),
      id: Joi.string().optional(),
      title: Joi.string().required(),
      completed: Joi.boolean().default(false),
    })
  ).optional(),
  order: Joi.number().optional(),
  estimatedHours: Joi.number().min(0).optional(),
  loggedHours: Joi.number().min(0).optional(),
});

export const reorderTaskSchema = Joi.object({
  taskId: Joi.string().required().messages({
    'any.required': 'Task ID is required for reordering',
  }),
  sourceStatus: Joi.string().required(),
  destinationStatus: Joi.string().required(),
  newOrder: Joi.number().required(),
  columnId: Joi.string().optional(),
});

export const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required().messages({
    'string.empty': 'Comment cannot be empty',
    'any.required': 'Comment content is required',
  }),
});
