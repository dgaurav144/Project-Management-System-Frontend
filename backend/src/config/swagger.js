import swaggerUi from 'swagger-ui-express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Project Management & Collaboration Tool API',
    version: '1.0.0',
    description: `
### Overview
RESTful API for full-stack project management, Kanban boards, role-based collaboration, task tracking, comments, and activity audit logging.

### Features
- **JWT Authentication** (Access tokens + Refresh token rotation)
- **Role-Based Access Control** (System Admin, Project Owner, Admin, Member, Viewer)
- **Projects & Kanban Boards** (Custom columns, drag-and-drop ordering)
- **Task Management** (Priorities, Due dates, Assignees, Subtasks, Activity History, Comments)
- **Search & Filtering** (Multi-field query, status, priority, assignee, due date)
- **Standardized Responses** and Centralized Error Handling
    `,
    contact: {
      name: 'API Support Team',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token in the format **Bearer &lt;token&gt;**',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '6651234abcd5678ef9012345' },
          name: { type: 'string', example: 'Sarah Connor' },
          email: { type: 'string', example: 'sarah@example.com' },
          avatar: { type: 'string', example: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah' },
          role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6651234abcd5678ef9012346' },
          name: { type: 'string', example: 'E-Commerce Platform Redesign' },
          key: { type: 'string', example: 'ECOMM' },
          description: { type: 'string', example: 'Revamping the core checkout and discovery flows' },
          color: { type: 'string', example: '#6366f1' },
          owner: { $ref: '#/components/schemas/User' },
          members: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                role: { type: 'string', enum: ['owner', 'admin', 'member', 'viewer'], example: 'admin' },
                joinedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
          status: { type: 'string', enum: ['active', 'archived'], example: 'active' },
        },
      },
      Board: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6651234abcd5678ef9012347' },
          name: { type: 'string', example: 'Sprint 42' },
          description: { type: 'string', example: 'Two-week sprint cycle board' },
          project: { type: 'string', example: '6651234abcd5678ef9012346' },
          columns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'col-todo' },
                name: { type: 'string', example: 'To Do' },
                key: { type: 'string', example: 'todo' },
                color: { type: 'string', example: '#64748b' },
                order: { type: 'number', example: 0 },
              },
            },
          },
        },
      },
      Task: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6651234abcd5678ef9012348' },
          title: { type: 'string', example: 'Implement Stripe Elements Checkout' },
          description: { type: 'string', example: 'Integrate 3D secure payment flow' },
          status: { type: 'string', enum: ['todo', 'in-progress', 'review', 'done'], example: 'in-progress' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], example: 'high' },
          dueDate: { type: 'string', format: 'date-time' },
          assignees: {
            type: 'array',
            items: { $ref: '#/components/schemas/User' },
          },
          creator: { $ref: '#/components/schemas/User' },
          tags: { type: 'array', items: { type: 'string' }, example: ['frontend', 'payment'] },
          subtasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', example: 'Setup Stripe API keys' },
                completed: { type: 'boolean', example: true },
              },
            },
          },
          order: { type: 'number', example: 1000 },
          commentCount: { type: 'number', example: 3 },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6651234abcd5678ef9012349' },
          task: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
          content: { type: 'string', example: 'PR is up for review at #142' },
          isEdited: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 20 },
              totalItems: { type: 'number', example: 45 },
              totalPages: { type: 'number', example: 3 },
              hasMore: { type: 'boolean', example: true },
            },
          },
        },
      },
      ApiErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Resource not found' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Please enter a valid email address' },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Sarah Connor' },
                  email: { type: 'string', example: 'sarah@example.com' },
                  password: { type: 'string', example: 'securePass123' },
                  role: { type: 'string', enum: ['admin', 'user'], default: 'user' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Registered successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          409: { description: 'Email already in use' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@example.com' },
                  password: { type: 'string', example: 'admin123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token using refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Tokens rotated and refreshed' },
          401: { description: 'Invalid or revoked refresh token' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current authenticated user profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'User retrieved' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List all accessible projects for current user',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search term for name/key' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'archived'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'List of projects' },
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a new project',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Mobile Banking App' },
                  description: { type: 'string', example: 'Next-generation banking experience' },
                  key: { type: 'string', example: 'BANK' },
                  color: { type: 'string', example: '#3b82f6' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Project created' },
        },
      },
    },
    '/projects/{projectId}/members': {
      post: {
        tags: ['Projects'],
        summary: 'Invite a member to a project',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', example: 'john@example.com' },
                  role: { type: 'string', enum: ['admin', 'member', 'viewer'], default: 'member' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Member invited successfully' },
        },
      },
    },
    '/boards/project/{projectId}': {
      get: {
        tags: ['Boards'],
        summary: 'Get all boards inside a project',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'List of boards' },
        },
      },
      post: {
        tags: ['Boards'],
        summary: 'Create a new board in a project',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Bug Triage' },
                  description: { type: 'string', example: 'Board for incoming bugs and defects' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Board created' },
        },
      },
    },
    '/tasks/board/{boardId}': {
      get: {
        tags: ['Tasks'],
        summary: 'Get tasks in a board with search and filtering',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'boardId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Text search query' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['todo', 'in-progress', 'review', 'done'] } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] } },
          { name: 'assignee', in: 'query', schema: { type: 'string' }, description: 'User ID of assignee' },
          { name: 'dueDateFilter', in: 'query', schema: { type: 'string', enum: ['overdue', 'today', 'this_week'] } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['order', 'dueDate', 'priority', 'createdAt'] } },
        ],
        responses: {
          200: { description: 'List of tasks matching filters' },
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a new task in a board',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'Design mobile navigation' },
                  description: { type: 'string', example: 'Create Figma wireframes and high-fidelity mockups' },
                  status: { type: 'string', enum: ['todo', 'in-progress', 'review', 'done'], default: 'todo' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
                  dueDate: { type: 'string', format: 'date-time' },
                  assignees: { type: 'array', items: { type: 'string' } },
                  tags: { type: 'array', items: { type: 'string' }, example: ['design', 'mobile'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Task created' },
        },
      },
    },
    '/tasks/{taskId}/status': {
      patch: {
        tags: ['Tasks'],
        summary: 'Update task status (e.g. Todo -> In Progress -> Done)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['todo', 'in-progress', 'review', 'done'] },
                  columnId: { type: 'string' },
                  order: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Task status updated' },
        },
      },
    },
    '/tasks/{taskId}/comments': {
      get: {
        tags: ['Comments'],
        summary: 'Get comments on a task',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'List of comments' },
        },
      },
      post: {
        tags: ['Comments'],
        summary: 'Add a comment to a task',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', example: 'Reviewed the specs, looks great!' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Comment added' },
        },
      },
    },
  },
};

export const serveSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Project Management Tool - API Docs',
  }));
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
};
