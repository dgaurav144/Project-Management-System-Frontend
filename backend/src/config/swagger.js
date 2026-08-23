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

const swaggerCustomCss = `
  /* PulseFlow Swagger UI Dark Premium Theme */
  body {
    background-color: #0B0F19 !important;
    color: #F3F4F6 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
    margin: 0;
    padding: 0;
  }
  .swagger-ui {
    color: #E5E7EB !important;
  }
  .swagger-ui .topbar {
    background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%) !important;
    border-bottom: 1px solid rgba(99, 102, 241, 0.25) !important;
    padding: 14px 20px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
  }
  .swagger-ui .topbar-wrapper {
    display: flex;
    align-items: center;
  }
  .swagger-ui .topbar-wrapper::before {
    content: '⚡ PulseFlow API Documentation';
    color: #FFFFFF;
    font-weight: 800;
    font-size: 1.25rem;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, #6366F1 0%, #38BDF8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .swagger-ui .topbar-wrapper img {
    display: none !important;
  }
  .swagger-ui .info {
    margin: 35px 0 25px 0 !important;
  }
  .swagger-ui .info .title {
    color: #FFFFFF !important;
    font-weight: 800 !important;
    font-size: 2rem !important;
    letter-spacing: -0.03em !important;
  }
  .swagger-ui .info .title small {
    background: rgba(99, 102, 241, 0.2) !important;
    color: #818CF8 !important;
    border-radius: 6px !important;
    padding: 3px 8px !important;
    font-size: 0.75rem !important;
    font-weight: 700 !important;
  }
  .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info td {
    color: #9CA3AF !important;
    font-size: 0.95rem !important;
    line-height: 1.6 !important;
  }
  .swagger-ui .scheme-container {
    background: #111827 !important;
    border: 1px solid #1F2937 !important;
    border-radius: 12px !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
    padding: 16px 24px !important;
    margin-bottom: 30px !important;
  }
  .swagger-ui .schemes-title {
    color: #D1D5DB !important;
  }
  .swagger-ui select {
    background: #1F2937 !important;
    color: #F9FAFB !important;
    border: 1px solid #374151 !important;
    border-radius: 8px !important;
    padding: 6px 12px !important;
  }
  .swagger-ui .opblock-tag {
    color: #F9FAFB !important;
    border-bottom: 1px solid #1F2937 !important;
    font-weight: 700 !important;
    font-size: 1.2rem !important;
    padding: 14px 0 !important;
  }
  .swagger-ui .opblock-tag small {
    color: #6B7280 !important;
  }
  .swagger-ui .opblock {
    border-radius: 12px !important;
    border: 1px solid #1F2937 !important;
    background: #111827 !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2) !important;
    margin: 0 0 14px !important;
    overflow: hidden !important;
    transition: all 0.2s ease !important;
  }
  .swagger-ui .opblock:hover {
    border-color: #374151 !important;
  }
  .swagger-ui .opblock .opblock-summary {
    border-color: #1F2937 !important;
    padding: 10px 16px !important;
  }
  .swagger-ui .opblock .opblock-summary-path {
    color: #F3F4F6 !important;
    font-weight: 600 !important;
    font-size: 0.95rem !important;
  }
  .swagger-ui .opblock .opblock-summary-description {
    color: #9CA3AF !important;
    font-size: 0.85rem !important;
  }
  .swagger-ui .opblock.opblock-get {
    background: rgba(14, 165, 233, 0.04) !important;
    border-color: rgba(14, 165, 233, 0.25) !important;
  }
  .swagger-ui .opblock.opblock-get .opblock-summary-method {
    background: #0284c7 !important;
    border-radius: 8px !important;
    font-weight: 700 !important;
    text-shadow: none !important;
  }
  .swagger-ui .opblock.opblock-post {
    background: rgba(16, 185, 129, 0.04) !important;
    border-color: rgba(16, 185, 129, 0.25) !important;
  }
  .swagger-ui .opblock.opblock-post .opblock-summary-method {
    background: #059669 !important;
    border-radius: 8px !important;
    font-weight: 700 !important;
    text-shadow: none !important;
  }
  .swagger-ui .opblock.opblock-patch {
    background: rgba(245, 158, 11, 0.04) !important;
    border-color: rgba(245, 158, 11, 0.25) !important;
  }
  .swagger-ui .opblock.opblock-patch .opblock-summary-method {
    background: #d97706 !important;
    border-radius: 8px !important;
    font-weight: 700 !important;
    text-shadow: none !important;
  }
  .swagger-ui .opblock.opblock-delete {
    background: rgba(244, 63, 94, 0.04) !important;
    border-color: rgba(244, 63, 94, 0.25) !important;
  }
  .swagger-ui .opblock.opblock-delete .opblock-summary-method {
    background: #e11d48 !important;
    border-radius: 8px !important;
    font-weight: 700 !important;
    text-shadow: none !important;
  }
  .swagger-ui .opblock-body {
    background: #0B0F19 !important;
    border-top: 1px solid #1F2937 !important;
  }
  .swagger-ui .opblock-description-wrapper, .swagger-ui .opblock-external-docs-wrapper, .swagger-ui .opblock-title_normal {
    color: #9CA3AF !important;
  }
  .swagger-ui table thead tr td, .swagger-ui table thead tr th {
    color: #D1D5DB !important;
    border-bottom: 1px solid #374151 !important;
  }
  .swagger-ui .parameters-col_name {
    color: #F3F4F6 !important;
  }
  .swagger-ui .parameter__name {
    color: #818CF8 !important;
    font-weight: 600 !important;
  }
  .swagger-ui .parameter__type {
    color: #9CA3AF !important;
  }
  .swagger-ui input[type=text], .swagger-ui input[type=password], .swagger-ui textarea {
    background: #1F2937 !important;
    color: #F9FAFB !important;
    border: 1px solid #374151 !important;
    border-radius: 8px !important;
    padding: 8px 12px !important;
  }
  .swagger-ui .btn {
    border-radius: 8px !important;
    border-color: #374151 !important;
    color: #E5E7EB !important;
    font-weight: 600 !important;
    transition: all 0.15s ease !important;
  }
  .swagger-ui .btn.authorize {
    color: #10B981 !important;
    border-color: rgba(16, 185, 129, 0.4) !important;
    background: rgba(16, 185, 129, 0.1) !important;
  }
  .swagger-ui .btn.authorize svg {
    fill: #10B981 !important;
  }
  .swagger-ui .btn.execute {
    background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%) !important;
    border: none !important;
    color: #FFFFFF !important;
    font-weight: 600 !important;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4) !important;
  }
  .swagger-ui .response-col_status {
    color: #F3F4F6 !important;
  }
  .swagger-ui .responses-inner h4, .swagger-ui .responses-inner h5 {
    color: #E5E7EB !important;
  }
  .swagger-ui .highlight-code, .swagger-ui .microlight, .swagger-ui pre {
    background: #030712 !important;
    color: #F3F4F6 !important;
    border-radius: 8px !important;
    border: 1px solid #1F2937 !important;
  }
  .swagger-ui .dialog-ux .modal-ux {
    background: #111827 !important;
    border: 1px solid #374151 !important;
    border-radius: 16px !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8) !important;
  }
  .swagger-ui .dialog-ux .modal-ux-header {
    border-bottom: 1px solid #1F2937 !important;
  }
  .swagger-ui .dialog-ux .modal-ux-header h3 {
    color: #FFFFFF !important;
  }
  .swagger-ui .dialog-ux .modal-ux-content {
    color: #9CA3AF !important;
  }
  .swagger-ui .model-box {
    background: #111827 !important;
    border-radius: 8px !important;
  }
  .swagger-ui section.models {
    border: 1px solid #1F2937 !important;
    border-radius: 12px !important;
    background: #111827 !important;
  }
  .swagger-ui section.models h4 {
    color: #F3F4F6 !important;
  }
  .swagger-ui .model-title {
    color: #818CF8 !important;
  }
`;

export const serveSwagger = (app) => {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customCss: swaggerCustomCss,
      customSiteTitle: 'PulseFlow — Interactive API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 1,
      },
    })
  );
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
};
