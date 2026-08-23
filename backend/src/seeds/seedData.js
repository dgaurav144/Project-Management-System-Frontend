import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Board from '../models/Board.js';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import ActivityLog from '../models/ActivityLog.js';
import RefreshToken from '../models/RefreshToken.js';

dotenv.config();

export const seedDatabase = async (disconnectAfter = true) => {
  try {
    console.log('🌱 Starting database seeding process...');
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Clear existing collections
    console.log('🧹 Clearing existing collections...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Board.deleteMany({});
    await Task.deleteMany({});
    await Comment.deleteMany({});
    await ActivityLog.deleteMany({});
    await RefreshToken.deleteMany({});

    // 1. Create Users
    console.log('👤 Creating demo users...');
    const usersData = [
      {
        name: 'Alex Rivers (Admin)',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        password: 'password123',
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Emily Chen',
        email: 'emily@example.com',
        password: 'password123',
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Marcus Vance',
        email: 'marcus@example.com',
        password: 'password123',
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      },
    ];

    const createdUsers = [];
    for (const u of usersData) {
      const user = await User.create(u);
      createdUsers.push(user);
    }
    const [admin, sarah, john, emily, marcus] = createdUsers;

    console.log(`✅ Created ${createdUsers.length} users.`);

    // 2. Create Projects
    console.log('📁 Creating demo projects...');
    const project1 = await Project.create({
      name: 'E-Commerce Platform Redesign',
      key: 'ECOMM',
      description: 'Modernizing checkout flow, performance optimization, and personalized product recommendations.',
      color: '#6366f1',
      owner: sarah._id,
      members: [
        { user: sarah._id, role: 'owner', joinedAt: new Date() },
        { user: admin._id, role: 'admin', joinedAt: new Date() },
        { user: john._id, role: 'member', joinedAt: new Date() },
        { user: emily._id, role: 'member', joinedAt: new Date() },
        { user: marcus._id, role: 'viewer', joinedAt: new Date() },
      ],
      status: 'active',
    });

    const project2 = await Project.create({
      name: 'Mobile Banking App V2',
      key: 'BANK',
      description: 'Biometric authentication, instant wire transfers, and spending analytics dashboard.',
      color: '#0ea5e9',
      owner: john._id,
      members: [
        { user: john._id, role: 'owner', joinedAt: new Date() },
        { user: sarah._id, role: 'admin', joinedAt: new Date() },
        { user: emily._id, role: 'member', joinedAt: new Date() },
      ],
      status: 'active',
    });

    const project3 = await Project.create({
      name: 'AI Analytics Copilot',
      key: 'DATA',
      description: 'Natural language querying and automated anomaly detection engine.',
      color: '#10b981',
      owner: admin._id,
      members: [
        { user: admin._id, role: 'owner', joinedAt: new Date() },
        { user: sarah._id, role: 'member', joinedAt: new Date() },
        { user: marcus._id, role: 'member', joinedAt: new Date() },
      ],
      status: 'active',
    });

    console.log('✅ Created 3 projects.');

    // 3. Create Boards
    console.log('📋 Creating boards...');
    const board1 = await Board.create({
      name: 'Sprint 42 (Current)',
      description: 'Current 2-week active sprint development board',
      project: project1._id,
      isDefault: true,
      order: 0,
    });

    const board2 = await Board.create({
      name: 'Product Backlog',
      description: 'Feature requests and architectural roadmap items',
      project: project1._id,
      isDefault: false,
      order: 1,
    });

    const board3 = await Board.create({
      name: 'Mobile Core Sprint',
      description: 'Active sprint for iOS & Android components',
      project: project2._id,
      isDefault: true,
      order: 0,
    });

    const board4 = await Board.create({
      name: 'AI Core Sprint 1',
      description: 'Active development sprint for LLM agents and embeddings',
      project: project3._id,
      isDefault: true,
      order: 0,
    });

    console.log('✅ Created 4 boards across all projects.');

    // 4. Create Tasks
    console.log('📌 Creating tasks...');
    const now = new Date();
    const futureDate = (days) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d;
    };
    const pastDate = (days) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return d;
    };

    const tasksData = [
      // AI Analytics Copilot (Project 3 - Admin Owned)
      {
        title: 'Train RAG vector embeddings on internal support docs',
        description: 'Generate OpenAI text-embedding-3-small embeddings and store in Pinecone / ChromaDB.',
        project: project3._id,
        board: board4._id,
        status: 'in-progress',
        columnId: 'col-inprogress',
        priority: 'urgent',
        dueDate: futureDate(2),
        assignees: [admin._id, sarah._id],
        creator: admin._id,
        tags: ['ai', 'embeddings', 'rag'],
        subtasks: [
          { title: 'Scrape markdown documentation', completed: true },
          { title: 'Chunk docs into 512 token windows', completed: true },
          { title: 'Index vectors with metadata tags', completed: false },
        ],
        order: 1000,
        estimatedHours: 8,
      },
      {
        title: 'Implement streaming response UI with markdown parser',
        description: 'Render token stream with smooth typewriter animation and syntax highlighted code blocks.',
        project: project3._id,
        board: board4._id,
        status: 'todo',
        columnId: 'col-todo',
        priority: 'high',
        dueDate: futureDate(4),
        assignees: [admin._id],
        creator: admin._id,
        tags: ['frontend', 'ai', 'streaming'],
        subtasks: [
          { title: 'Setup Server-Sent Events (SSE) listener', completed: false },
        ],
        order: 2000,
        estimatedHours: 6,
      },
      {
        title: 'Setup API Gateway Rate Limiting for LLM inferences',
        description: 'Enforce per-user token quotas and sliding window throttling.',
        project: project3._id,
        board: board4._id,
        status: 'done',
        columnId: 'col-done',
        priority: 'medium',
        dueDate: pastDate(1),
        assignees: [admin._id],
        creator: admin._id,
        tags: ['backend', 'security', 'rate-limit'],
        subtasks: [
          { title: 'Configure Redis sliding window counter', completed: true },
        ],
        order: 1000,
        estimatedHours: 4,
      },

      // Sprint 42 - E-Commerce (Project 1)
      {
        title: 'Implement Stripe 3D Secure 2.0 Webhook handler',
        description: 'Ensure idempotency and store payment intent states in MongoDB upon receiving payment_intent.succeeded.',
        project: project1._id,
        board: board1._id,
        status: 'todo',
        columnId: 'col-todo',
        priority: 'urgent',
        dueDate: futureDate(2),
        assignees: [sarah._id, john._id],
        creator: sarah._id,
        tags: ['backend', 'payments', 'security'],
        subtasks: [
          { title: 'Create signature verification middleware', completed: true },
          { title: 'Handle customer.subscription.created events', completed: false },
          { title: 'Add exponential backoff webhook retry logic', completed: false },
        ],
        order: 1000,
        estimatedHours: 8,
      },
      {
        title: 'Design Dark Mode palette & Design Tokens in Figma',
        description: 'Define semantic color variables for dark glassmorphism surfaces, borders, and contrast ratios.',
        project: project1._id,
        board: board1._id,
        status: 'todo',
        columnId: 'col-todo',
        priority: 'medium',
        dueDate: futureDate(5),
        assignees: [emily._id],
        creator: sarah._id,
        tags: ['ui/ux', 'design-system'],
        subtasks: [
          { title: 'Audit existing color usage', completed: true },
          { title: 'Create Tailwind CSS color token export', completed: false },
        ],
        order: 2000,
        estimatedHours: 4,
      },
      {
        title: 'Add Redis Cache for Product Catalog Listing',
        description: 'Cache high-traffic category endpoints with 60s TTL and cache invalidation on product update.',
        project: project1._id,
        board: board1._id,
        status: 'todo',
        columnId: 'col-todo',
        priority: 'high',
        dueDate: futureDate(3),
        assignees: [john._id],
        creator: admin._id,
        tags: ['performance', 'caching', 'redis'],
        subtasks: [
          { title: 'Setup Redis connection pool', completed: false },
          { title: 'Implement cache middleware', completed: false },
        ],
        order: 3000,
        estimatedHours: 6,
      },

      // Sprint 42 - In Progress
      {
        title: 'Build Drag & Drop Kanban Task Reordering',
        description: 'Support optimistic state transitions with animated drop placeholders and debounced batch updates.',
        project: project1._id,
        board: board1._id,
        status: 'in-progress',
        columnId: 'col-inprogress',
        priority: 'urgent',
        dueDate: futureDate(1),
        assignees: [john._id, sarah._id],
        creator: sarah._id,
        tags: ['frontend', 'react', 'kanban'],
        subtasks: [
          { title: 'Implement HTML5 Drag handlers', completed: true },
          { title: 'Add visual indicator on hover', completed: true },
          { title: 'Persist column position to backend API', completed: false },
        ],
        order: 1000,
        estimatedHours: 12,
      },
      {
        title: 'OAuth 2.0 Google & GitHub Login integration',
        description: 'Add social login buttons on authentication modal and link social identity to existing user profile.',
        project: project1._id,
        board: board1._id,
        status: 'in-progress',
        columnId: 'col-inprogress',
        priority: 'high',
        dueDate: futureDate(4),
        assignees: [sarah._id],
        creator: admin._id,
        tags: ['auth', 'security', 'oauth'],
        subtasks: [
          { title: 'Configure Google Cloud Console Credentials', completed: true },
          { title: 'Create callback exchange endpoint', completed: false },
        ],
        order: 2000,
        estimatedHours: 8,
      },

      // Sprint 42 - In Review
      {
        title: 'Audit Log & Activity Stream component',
        description: 'Real-time timeline displaying state transitions, commenter avatars, and timestamp badges.',
        project: project1._id,
        board: board1._id,
        status: 'review',
        columnId: 'col-review',
        priority: 'medium',
        dueDate: pastDate(1),
        assignees: [emily._id, john._id],
        creator: sarah._id,
        tags: ['frontend', 'activity-log'],
        subtasks: [
          { title: 'Design activity row layout', completed: true },
          { title: 'Format relative timestamps with date-fns', completed: true },
          { title: 'Add filter by action type', completed: true },
        ],
        order: 1000,
        estimatedHours: 6,
      },

      // Sprint 42 - Done
      {
        title: 'JWT Refresh Token Rotation with Revocation List',
        description: 'Issue short-lived access tokens (15m) and store refresh tokens in MongoDB with TTL indexing.',
        project: project1._id,
        board: board1._id,
        status: 'done',
        columnId: 'col-done',
        priority: 'high',
        dueDate: pastDate(3),
        assignees: [sarah._id],
        creator: admin._id,
        tags: ['backend', 'auth', 'jwt'],
        subtasks: [
          { title: 'Create RefreshToken schema with TTL index', completed: true },
          { title: 'Implement axios response interceptor for 401 refresh', completed: true },
          { title: 'Add revocation on user logout', completed: true },
        ],
        order: 1000,
        estimatedHours: 10,
      },
      {
        title: 'Setup Swagger OpenAPI 3.0 Documentation',
        description: 'Interactive API Explorer at /api/docs with bearer auth headers and sample schemas.',
        project: project1._id,
        board: board1._id,
        status: 'done',
        columnId: 'col-done',
        priority: 'low',
        dueDate: pastDate(2),
        assignees: [admin._id],
        creator: admin._id,
        tags: ['docs', 'swagger', 'api'],
        subtasks: [
          { title: 'Define OpenAPI schemas for models', completed: true },
          { title: 'Mount swagger-ui-express route', completed: true },
        ],
        order: 2000,
        estimatedHours: 4,
      },

      // Mobile Banking tasks (Project 2)
      {
        title: 'Biometric FaceID / TouchID Keyring integration',
        description: 'Secure enclave key storage for zero-touch mobile login.',
        project: project2._id,
        board: board3._id,
        status: 'in-progress',
        columnId: 'col-inprogress',
        priority: 'urgent',
        dueDate: futureDate(3),
        assignees: [john._id],
        creator: john._id,
        tags: ['mobile', 'security'],
        subtasks: [
          { title: 'iOS LocalAuthentication framework wrap', completed: true },
          { title: 'Android BiometricPrompt API integration', completed: false },
        ],
        order: 1000,
        estimatedHours: 14,
      },
      {
        title: 'Real-time Push Notifications for Transactions',
        description: 'FCM push messages sent immediately when account balance updates.',
        project: project2._id,
        board: board3._id,
        status: 'todo',
        columnId: 'col-todo',
        priority: 'high',
        dueDate: futureDate(6),
        assignees: [emily._id],
        creator: john._id,
        tags: ['mobile', 'push-notifications'],
        subtasks: [],
        order: 1000,
        estimatedHours: 8,
      },
    ];

    const createdTasks = await Task.insertMany(tasksData);
    console.log(`✅ Created ${createdTasks.length} tasks.`);

    // 5. Create Comments
    console.log('💬 Creating comments...');
    const dndTask = createdTasks.find((t) => t.title.includes('Kanban'));
    const stripeTask = createdTasks.find((t) => t.title.includes('Stripe'));
    const jwtTask = createdTasks.find((t) => t.title.includes('JWT'));

    if (dndTask) {
      await Comment.create({
        task: dndTask._id,
        project: project1._id,
        user: emily._id,
        content: 'I created smooth drag hover animations and CSS drop zone highlights for this!',
      });
      await Comment.create({
        task: dndTask._id,
        project: project1._id,
        user: john._id,
        content: 'Awesome! I am hooking up the patch endpoint now so the reordered cards save instantly.',
      });
    }

    if (stripeTask) {
      await Comment.create({
        task: stripeTask._id,
        project: project1._id,
        user: sarah._id,
        content: 'We need to make sure webhooks test with Stripe CLI before deploying to staging.',
      });
    }

    if (jwtTask) {
      await Comment.create({
        task: jwtTask._id,
        project: project1._id,
        user: admin._id,
        content: 'Verified the refresh rotation logic with Postman. Works seamlessly.',
      });
    }

    // 6. Create Activity Logs
    console.log('📜 Creating activity audit logs...');
    const activityLogs = [
      {
        project: project1._id,
        board: board1._id,
        task: dndTask?._id,
        user: john._id,
        action: 'TASK_STATUS_CHANGED',
        details: 'John Doe moved "Build Drag & Drop Kanban Task Reordering" to IN-PROGRESS',
        meta: { from: 'todo', to: 'in-progress' },
      },
      {
        project: project1._id,
        board: board1._id,
        task: jwtTask?._id,
        user: sarah._id,
        action: 'TASK_STATUS_CHANGED',
        details: 'Sarah Connor moved "JWT Refresh Token Rotation with Revocation List" to DONE',
        meta: { from: 'review', to: 'done' },
      },
      {
        project: project1._id,
        board: board1._id,
        task: stripeTask?._id,
        user: sarah._id,
        action: 'TASK_ASSIGNED',
        details: 'Sarah Connor assigned John Doe to "Implement Stripe 3D Secure 2.0 Webhook handler"',
      },
      {
        project: project1._id,
        board: board1._id,
        task: dndTask?._id,
        user: emily._id,
        action: 'COMMENT_ADDED',
        details: 'Emily Chen commented on "Build Drag & Drop Kanban Task Reordering"',
      },
      {
        project: project1._id,
        user: sarah._id,
        action: 'MEMBER_INVITED',
        details: 'Sarah Connor invited Emily Chen as member',
      },
    ];

    await ActivityLog.insertMany(activityLogs);
    console.log('✅ Activity audit logs created.');

    console.log('\n======================================================');
    console.log('🎉 Database seeding completed successfully!');
    console.log('======================================================');
    console.log('Demo Accounts for Testing:');
    console.log('1. Admin:    admin@example.com  / password123 (Role: admin)');
    console.log('2. Lead Dev: sarah@example.com  / password123 (Project Owner)');
    console.log('3. Dev:      john@example.com   / password123 (Member)');
    console.log('4. Designer: emily@example.com  / password123 (Member)');
    console.log('======================================================\n');

    if (disconnectAfter) {
      await disconnectDB();
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    if (disconnectAfter) {
      await disconnectDB();
      process.exit(1);
    }
  }
};

export const autoSeedIfEmpty = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Database is empty! Auto-seeding initial demo data...');
      await seedDatabase(false);
    }
  } catch (err) {
    console.error('Auto-seed check error:', err.message);
  }
};

// If run directly from CLI
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('seedData.js')) {
  seedDatabase(true);
}
