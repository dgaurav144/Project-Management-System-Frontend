# ⚡ PulseFlow — Project Management & Collaboration Platform

> An enterprise-grade, full-stack Agile Project Management and Team Collaboration platform featuring interactive Kanban drag-and-drop boards, dynamic RBAC permission matrices, project lifecycle management (Active, Completed, Archived), real-time @mentions, in-app notifications, chronological audit trails, subtask checklists, and secure HTTP-only cookie JWT authentication.

---

## 🔑 Demo User Accounts & Credentials (For Evaluation)

You can log in directly using any of the pre-seeded accounts below to test role-based permissions, task workflows, and administrative controls:

| User Name | Email Address | Password | Global Role | Project Role & Permissions Scope |
|---|---|---|:---:|---|
| 👑 **Alex Rivers** | `admin@example.com` | `password123` | **`admin`** | **System Administrator**<br>• Master control across all workspaces and projects<br>• Manage all users, delete any project<br>• Automatic bypass of project permission restrictions |
| 🚀 **Sarah Connor** | `sarah@example.com` | `password123` | **`user`** | **Project Owner (E-Commerce Platform Redesign)**<br>• Full workspace owner authority<br>• Invite & remove members, assign custom roles<br>• Configure dynamic Role Permission Matrix<br>• Mark projects as Completed / Archived |
| 💻 **John Doe** | `john@example.com` | `password123` | **`user`** | **Project Owner (Mobile Banking) / Member (E-Commerce)**<br>• Create, edit, and move tasks via Kanban<br>• Post comments, @mention teammates, track logged hours<br>• Restricted from deleting boards/projects in E-Commerce |
| 🎨 **Emily Chen** | `emily@example.com` | `password123` | **`user`** | **Team Member (UI/UX Designer)**<br>• Create and edit assigned task cards<br>• Drag-and-drop cards across sprint columns<br>• Complete subtasks checklists and collaborate |

---

## ✨ Key Platform Features

### 1. 🔐 Enterprise-Grade HTTP-Only Cookie Authentication
- **Secure Token Delivery**: Tokens are stored exclusively in **HTTP-only, SameSite Cookies** (`pulseflow_access_token` & `pulseflow_refresh_token`), protecting against XSS token theft.
- **Short-Lived Access Tokens (15 min)**: Paired with automated Refresh Token rotation (7 days) and database-level revocation lists.
- **Silent Refresh Interceptors**: Axios automatically refreshes expired sessions seamlessly in the background with `withCredentials: true`.

### 2. 👥 Multi-Tier Role-Based Access Control (RBAC)
- **System-Level Roles**: `admin` (System Administrator) vs `user` (Standard User).
- **Workspace-Level Roles**:
  - **👑 Owner**: Full workspace ownership and lifecycle governance.
  - **🛡️ Admin**: Project management, member invites, board creation, and task administration.
  - **✍️ Member**: Task creation, task editing, drag-and-drop movement, checklist completion, and commenting.
  - **👁️ Viewer**: Read-only access across all project resources.
- **Dynamic Permission Matrix**: Project owners can dynamically toggle granular permissions (`createTasks`, `editTasks`, `deleteTasks`, `moveTasks`, `manageBoards`, etc.) per role in real-time.

### 3. 📋 Agile Kanban Boards with Real-Time Drag & Drop
- **Multi-Board Sprint Support**: Create and manage multiple sprint boards (`Sprint 1`, `Backlog`, etc.) per project.
- **Fluid Drag-and-Drop**: HTML5 drag-and-drop with optimistic UI updates across customizable status columns (`To Do`, `In Progress`, `In Review`, `Done`).
- **Synchronized State**: Instant synchronization between task detail modals, Kanban cards, and backend MongoDB persistence.
- **Milestone Celebration**: Confetti bursts upon moving tasks to `Done` or marking a project as `Completed`.

### 4. 💬 Team Collaboration, @Mentions & Notifications
- **Threaded Task Comments**: Interactive discussions on task detail modals with timestamps and author avatars.
- **@Mention Autocomplete**: Type `@` to search and tag team members inside comments.
- **In-App Notification Center**: Real-time bell dropdown with unread badge counter, notification read/clear actions, and direct deep-linking to referenced tasks.

### 5. 📜 Chronological Activity Audit Trail
- Automated logging of all critical workspace events: task creation, status transitions, priority updates, assignee changes, member invites, and role updates.

### 6. 🚀 Project Lifecycle & Milestone Management
- Seamlessly transition projects across **`Active`**, **`Completed`** (celebratory banner, milestone summary), and **`Archived`** states.
- Protected cascade deletion of boards, tasks, comments, and audit logs.

---

## 🏗️ Tech Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, Vite, Vanilla CSS Design System (Dark Glassmorphism), Lucide Icons, Canvas Confetti |
| **Backend** | Node.js (v18+), Express.js (ES Modules), Mongoose / MongoDB (with auto In-Memory fallback) |
| **Security** | `cookie-parser`, `bcryptjs`, `jsonwebtoken`, `joi` validation, `helmet`, `cors`, `morgan`, `express-rate-limit` |
| **Documentation** | Interactive Swagger OpenAPI 3.0 (Custom Dark UI theme) & Postman v2.1 Collection |
| **Testing** | Native Node.js Automated E2E Test Suite (32/32 tests passing with 100% success rate) |

---

## 📁 Project Directory Structure

```
Duple/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection & Swagger OpenAPI config
│   │   ├── controllers/     # Auth, Projects, Boards, Tasks, Comments, Notifications
│   │   ├── middleware/      # Auth (JWT), RBAC authorization, Validation, Error Handler
│   │   ├── models/          # User, Project, Board, Task, Comment, Notification, ActivityLog
│   │   ├── routes/          # Express REST API routes
│   │   ├── seeds/           # Seed database with demo projects, users, tasks & audit logs
│   │   ├── utils/           # ApiResponse, ApiError, Token utils, Joi validators
│   │   ├── app.js           # Express app setup & security middleware
│   │   └── server.js        # Server entry point with auto-seeding on startup
│   ├── tests/
│   │   └── e2e-test.js      # 32 Automated E2E integration tests
│   ├── .env.example         # Environment template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── activity/    # ActivityDrawer audit stream
│   │   │   ├── auth/        # AuthModal login & register
│   │   │   ├── boards/      # CreateBoardModal, FilterBar
│   │   │   ├── kanban/      # KanbanBoard, KanbanColumn, TaskCard, TaskDetailModal, CreateTaskModal
│   │   │   ├── layout/      # Navbar, Sidebar, ErrorBoundary
│   │   │   ├── notifications/# NotificationCenter bell dropdown
│   │   │   ├── projects/    # CreateProjectModal, ProjectMembersModal, ProjectSettingsModal
│   │   │   └── tour/        # TourGuideModal interactive walkthrough
│   │   ├── context/         # AuthContext, BoardContext, ProjectContext, ToastContext
│   │   ├── services/        # Axios API client with HTTP-only cookie interceptors
│   │   ├── styles/          # index.css design tokens, animations, responsive layout
│   │   ├── utils/           # dateUtils helper functions
│   │   ├── App.jsx          # Root application component
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js       # Vite configuration with API reverse proxy
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md      # System architecture & data flow diagrams
│   ├── BACKGROUND_JOBS.md   # Background tasks & job scheduling strategy
│   ├── CACHING_STRATEGY.md  # In-memory & Redis caching documentation
│   └── postman_collection.json # Ready-to-import Postman v2.1 collection
├── .gitignore               # Comprehensive Git ignore rules
├── package.json             # Root workspace runner scripts
└── README.md                # Project documentation
```

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd Duple
```

### 2. Install Dependencies
```bash
npm run install:all
```
*(Or install individually: `cd backend && npm install` and `cd ../frontend && npm install`)*

### 3. Setup Environment Variables
```bash
# Backend Environment Setup
cp backend/.env.example backend/.env
```
*(On Windows PowerShell: `Copy-Item .\backend\.env.example .\backend\.env`)*

### 4. Seed the Database with Demo Data
```bash
npm run seed
```
> **Note**: If local MongoDB is not running, PulseFlow automatically starts an **In-Memory MongoDB fallback server** and automatically seeds the initial demo accounts on server startup!

### 5. Start the Application
```bash
# Runs backend (Port 5000) and frontend (Port 5173) concurrently
npm run dev
```

---

## 🌐 Application URLs

- **🖥️ Frontend Web Application**: **[http://localhost:5173](http://localhost:5173)**
- **⚡ Backend REST API**: **[http://localhost:5000/api/v1](http://localhost:5000/api/v1)**
- **📚 Interactive Swagger Docs (Dark Theme)**: **[http://localhost:5000/api/docs](http://localhost:5000/api/docs)**
- **📄 Raw OpenAPI Specification**: **[http://localhost:5000/api/docs.json](http://localhost:5000/api/docs.json)**
- **🩺 Health Check Endpoint**: **[http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)**

---

## 🧪 Automated Integration Tests

To run the automated test suite verifying all 32 endpoints, authentication flows, RBAC authorization, and data validation:

```bash
cd backend
node tests/e2e-test.js
```

### Test Suite Output:
```
======================================================
🎯 Test Summary: 32/32 Tests Passed (100% Success Rate)
======================================================
```

---

## 📄 License & Attribution
Developed with ❤️ by **Gaurav** for the **Full Stack Developer Technical Assessment** at **Duple IT Solutions**.
