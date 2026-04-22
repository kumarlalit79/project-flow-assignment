# ProjectFlow

A full-stack project management application with real-time collaboration. Teams can create projects, manage members with role-based access, and track tasks on a Kanban board. All task and project changes are broadcast live to every connected user in a project room via WebSockets, with no page refresh required.

**Tech Stack**

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, TanStack Query, Socket.IO Client, React Router v7
- **Backend**: Node.js, Express 5, TypeScript
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO with Redis adapter (Upstash Redis)
- **Auth**: JSON Web Tokens (JWT), bcryptjs
- **Validation**: Zod
- **Deployment**: Render (backend as Web Service, frontend as Static Site)

---

## Architecture Overview

```
Browser (React + Zustand)
        |
        |  REST (Axios)          WebSocket (Socket.IO-Client)
        |                                |
        v                                v
   Express REST API  <---------->  Socket.IO Server
        |                                |
        |                         Redis Pub/Sub Adapter
        |                         (Upstash, via ioredis)
        v
     MongoDB Atlas
```

### Request Flow (REST)

1. The React client sends an HTTP request via Axios with a JWT in the `Authorization` header.
2. The `protect` middleware verifies the token and attaches the user payload to `req.user`.
3. The `authorize` middleware optionally checks the user's global role (admin / member).
4. The route handler calls the appropriate service function.
5. The service performs the database operation via Mongoose and returns a typed `ApiResponse`.
6. The controller sends the response back to the client.

### Real-time Flow (WebSocket)

1. After login, the client connects to the Socket.IO server using the JWT as the handshake `auth.token`.
2. The server middleware verifies the token and stores the decoded payload on `socket.data.user`.
3. On mounting the task board page, the client emits `join:project` with the project ID.
4. The server places the socket in a room named `project:<projectId>`.
5. When a task is created, updated, deleted, or a member is added, the service layer emits the relevant event to that project room.
6. All connected clients receive the event and update their local Zustand store without refetching.
7. The Redis adapter (Upstash) ensures events are broadcast correctly even if the server scales to multiple instances.

---

## Design Decisions and Trade-offs

### Socket.IO

Socket.IO was chosen over raw WebSockets because it provides built-in room management, automatic reconnection, event namespacing, and a well-tested adapter system for Redis. The Redis adapter means the architecture can scale horizontally without losing broadcast reliability. The trade-off is a larger dependency footprint compared to native WebSocket.

### Zustand for State Management

Zustand was chosen over Redux or React Context because it eliminates boilerplate while still providing a predictable, subscribable store. The stores (`auth.store`, `project.store`, `task.store`) are small and focused, each handling one domain. Socket events update the task store directly, which re-renders only the affected components. Context API would not handle cross-component subscriptions as cleanly at this scale, and Redux adds unnecessary complexity for this project size.

### MongoDB

MongoDB was chosen because the data model maps naturally to documents. A project embeds its member list as a subdocument array, avoiding expensive joins for the common query of "fetch project with members." Tasks reference projects and users by ObjectId and are populated on read. The trade-off is that MongoDB lacks enforced relational integrity, so orphaned tasks after a project deletion must be handled in application code if required.

### Redis (Upstash)

Redis is used exclusively as a Socket.IO pub/sub adapter. It is not used as a cache in this project. Upstash was chosen because it offers a serverless Redis instance with TLS support that works without a self-managed Redis server. The trade-off is a slight latency overhead for the pub/sub round-trip. If only a single server instance is ever deployed, the Redis adapter is redundant, but it costs nothing to retain for future scalability.

### Role-Based Access Control

Two layers of roles exist. The global `UserRole` (`admin`, `member`) controls who can create projects and manage users. The per-project `ProjectMemberRole` (`manager`, `member`) controls who can create and edit tasks within a project. This separation means an admin can manage the system while project-specific authority is delegated to managers without elevating their global role.

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require the `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register a new user |
| POST | `/api/auth/login` | None | Login and receive a JWT |
| GET | `/api/auth/me` | Required | Get the currently authenticated user |

### Users

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/users` | Required | Admin | List all users |
| PATCH | `/api/users/:id/role` | Required | Admin | Update a user's global role |

### Projects

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/projects` | Required | Admin | Create a new project |
| GET | `/api/projects` | Required | Any | List projects the user is a member of |
| GET | `/api/projects/:id` | Required | Any | Get a single project with populated members |
| PATCH | `/api/projects/:id` | Required | Admin | Update project name or description |
| DELETE | `/api/projects/:id` | Required | Admin | Delete a project |
| POST | `/api/projects/:id/members` | Required | Admin or Project Manager | Add a member to a project |
| DELETE | `/api/projects/:id/members/:userId` | Required | Admin or Project Manager | Remove a member from a project |

### Tasks

All task routes are nested under `/api/projects/:projectId/tasks`.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/projects/:projectId/tasks` | Required | Create a task in the project |
| GET | `/api/projects/:projectId/tasks` | Required | List all tasks in the project |
| PATCH | `/api/projects/:projectId/tasks/:taskId` | Required | Update task fields (title, description, priority, assignee, dueDate) |
| PATCH | `/api/projects/:projectId/tasks/:taskId/status` | Required | Update task status only |
| DELETE | `/api/projects/:projectId/tasks/:taskId` | Required | Delete a task |

---

## Socket Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `join:project` | Client → Server | `{ projectId: string }` | Client requests to join the project room to receive live updates |
| `leave:project` | Client → Server | `{ projectId: string }` | Client leaves the project room, typically on page unmount |
| `task:created` | Server → Client | `{ task: Task }` | Emitted to the project room when a new task is created |
| `task:updated` | Server → Client | `{ task: Task }` | Emitted to the project room when a task is updated or its status changes |
| `task:deleted` | Server → Client | `{ taskId: string }` | Emitted to the project room when a task is deleted |
| `member:added` | Server → Client | `{ project: Project, member: ProjectMember, userId: string }` | Emitted to the project room and each member's personal room when a new member is added |
| `project:deleted` | Server → Client | `{ projectId: string }` | Emitted to the project room and each member's personal user room when a project is deleted |

Each authenticated socket is also automatically joined to a personal room named `user:<userId>` for targeted notifications such as project deletion and member addition events.

---

## Database Design

### Users Collection

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `name` | String | Display name |
| `email` | String | Unique, lowercase |
| `password` | String | Bcrypt hashed, minimum 6 characters |
| `role` | Enum | `admin` or `member` (global system role) |
| `createdAt` | Date | Auto-managed by Mongoose timestamps |
| `updatedAt` | Date | Auto-managed by Mongoose timestamps |

Passwords are hashed in a `pre('save')` hook using bcryptjs with a salt factor of 10.

### Projects Collection

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `name` | String | Project name |
| `description` | String | Project description |
| `createdBy` | ObjectId (ref: User) | The admin who created the project |
| `members` | Array of subdocuments | Embedded list of project members |
| `members[].user` | ObjectId (ref: User) | Reference to the user |
| `members[].role` | Enum | `manager` or `member` (project-level role) |
| `createdAt` | Date | Auto-managed |
| `updatedAt` | Date | Auto-managed |

Members are stored as an embedded subdocument array. When a project is fetched, `members.user` is populated with the user's `_id`, `name`, `email`, and `role` fields. The creator is automatically added as a `manager` when the project is created.

### Tasks Collection

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `title` | String | Task title |
| `description` | String | Task description |
| `status` | Enum | `todo`, `inProgress`, `done` |
| `priority` | Enum | `low`, `medium`, `high` |
| `project` | ObjectId (ref: Project) | The project this task belongs to |
| `assignee` | ObjectId (ref: User) or null | Assigned user, optional |
| `createdBy` | ObjectId (ref: User) | User who created the task |
| `dueDate` | Date or null | Optional due date |
| `createdAt` | Date | Auto-managed |
| `updatedAt` | Date | Auto-managed |

The `project` field is indexed for efficient task queries by project. When tasks are fetched or mutated, `assignee` is populated with `_id`, `name`, and `email`.

### Relationships

- A User can be a member of many Projects (via the embedded members array).
- A Project has many Tasks (one-to-many, Tasks reference Projects).
- A Task has one optional assignee (User) and one creator (User).

---

## Local Setup

### Prerequisites

- Node.js 20 or later
- npm
- A MongoDB Atlas cluster (or local MongoDB instance)
- An Upstash Redis instance (or local Redis)

### 1. Clone the Repository

```bash
git clone https://github.com/kumarlalit79/project-flow-assignment.git
cd project-flow-assignment
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/projectflow
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
REDIS_URL=rediss://default:<token>@ace-cheetah-104462.upstash.io:6379
CLIENT_URL=http://localhost:5173
```

For local Redis (without Upstash), use:

```env
REDIS_URL=redis://localhost:6379
```

Start the backend in development mode (requires Bun):

```bash
bun run dev
```

Or build and run with Node.js:

```bash
npm run build
node dist/server.js
```

The server will start on `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd client
npm install
```

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`.

### 4. Running Local Redis with Docker

If you do not have an Upstash account, you can run Redis locally using Docker:

```bash
docker run -d -p 6379:6379 redis:alpine
```

Set `REDIS_URL=redis://localhost:6379` in `server/.env`.

---

## Deployment

### Backend (Render Web Service)

1. Go to [render.com](https://render.com) and create a new **Web Service**.
2. Connect the GitHub repository `kumarlalit79/project-flow-assignment`.
3. Fill in the following settings:

| Setting | Value |
|---------|-------|
| Root Directory | `server` |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/server.js` |
| Environment | Node |

4. Add the following environment variables in the Render dashboard:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long, random secret string |
| `JWT_EXPIRES_IN` | `7d` |
| `REDIS_URL` | `rediss://default:<token>@<host>.upstash.io:6379` |
| `CLIENT_URL` | Your deployed frontend URL |

5. Deploy. Render will compile TypeScript and start the Node.js process.

### Frontend (Render Static Site)

1. Create a new **Static Site** on Render.
2. Connect the same repository.
3. Fill in the following settings:

| Setting | Value |
|---------|-------|
| Root Directory | `client` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

4. Add the following environment variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://project-flow-assignment.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://project-flow-assignment.onrender.com` |

5. Deploy. Vite will build the React app and Render will serve the static files.

### CI/CD

There is no custom CI/CD pipeline configured. Render automatically triggers a new deploy whenever a commit is pushed to the `main` branch.

---

## Live URLs

| Service | URL |
|---------|-----|
| Frontend | https://project-flow-assignment-client.onrender.com |
| Backend API | https://project-flow-assignment.onrender.com/api |
| Backend Health | https://project-flow-assignment.onrender.com |

> Note: The backend is deployed on Render's free tier. Instances spin down after 15 minutes of inactivity and may take up to 50 seconds to respond to the first request after a cold start.

---

## Backend Folder Structure

```
server/
  src/
    config/          # Environment, database, and Redis initialization
      db.ts          # Mongoose connection setup with pool configuration
      env.ts         # Zod-validated environment variable schema
      redis.ts       # ioredis client configured for Upstash TLS
    controllers/     # Request handlers — parse req, call service, send res
      auth.controller.ts
      project.controller.ts
      task.controller.ts
      user.controller.ts
    middleware/      # Express middleware
      auth.middleware.ts    # JWT verification (protect) and role check (authorize)
      error.middleware.ts   # Centralized error handler with status code support
      validate.middleware.ts # Zod schema validation for req.body, params, query
    models/          # Mongoose schema definitions
      user.model.ts
      project.model.ts
      task.model.ts
    routes/          # Express routers — map HTTP methods to controllers
      auth.routes.ts
      project.routes.ts
      task.routes.ts
      user.routes.ts
      index.ts       # Aggregates all routers under /api
    services/        # Business logic — database operations and socket emissions
      auth.service.ts
      project.service.ts
      task.service.ts
      user.service.ts
    sockets/         # Socket.IO setup and event handlers
      socket.manager.ts   # Server initialization, Redis adapter, JWT middleware
      socket.handlers.ts  # Per-connection event registration (join/leave room)
    types/           # Shared TypeScript interfaces, enums, and socket event names
      index.ts
    utils/           # Shared utilities
      api-response.utils.ts  # Typed ApiResponse wrapper for consistent responses
      jwt.utils.ts           # Token generation and verification helpers
    app.ts           # Express app creation, CORS, and route mounting
    server.ts        # HTTP server startup, DB connection, socket initialization
```

---

## Frontend Folder Structure

```
client/
  src/
    components/      # Reusable UI components
      common/        # Shared components: TaskModal, MembersModal, ConfirmDialog, etc.
      layout/        # Navbar and page layout wrappers
    hooks/           # Custom React hooks
      useSocket.ts   # Subscribes to task socket events for a project room
    lib/             # Third-party library configuration
      axios.ts       # Axios instance with base URL and auth interceptor
    pages/           # Route-level page components
      LoginPage.tsx
      RegisterPage.tsx
      ProjectsPage.tsx
      TaskBoardPage.tsx
    services/        # Client-side service modules
      socket.service.ts  # Socket.IO connection lifecycle management
    store/           # Zustand global state stores
      auth.store.ts
      project.store.ts
      task.store.ts
    types/           # Frontend TypeScript type definitions
    utils/           # Frontend utility functions
```
