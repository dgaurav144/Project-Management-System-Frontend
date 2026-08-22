# Caching Strategy & Performance Optimization

## 1. Overview

In high-concurrency project management systems, read operations (fetching Kanban boards, project metadata, task lists, and user profiles) outnumber write operations by roughly 10:1. Implementing an intelligent multi-tiered caching strategy ensures low-latency response times (< 20ms) and prevents database connection saturation.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   HTTP Client   │ ◄───► │  HTTP Gateway   │ ◄───► │  Redis Cluster  │ ◄───► │ MongoDB Primary │
│  (React/Axios)  │       │ (ETag & Cache)  │       │ (In-Memory L2)  │       │   (Persistent)  │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 2. Multi-Level Caching Tiers

### 2.1 Level 1: HTTP & Gateway Cache Headers
- **Static Assets & Public Data**: CDN edge caching with `Cache-Control: public, max-age=31536000, immutable` for static bundle assets.
- **Dynamic Board & Project Endpoints**: Conditional requests using HTTP `ETag` and `If-None-Match`. When the board data remains unchanged, the server returns HTTP `304 Not Modified`, saving payload bandwidth and client parsing CPU cycles.

### 2.2 Level 2: In-Memory Redis Cache
Redis serves as the distributed cache layer deployed alongside Express.js instances.

#### Key Namespace Patterns:
| Resource | Redis Key Pattern | TTL | Invalidation Trigger |
|---|---|---|---|
| Project Metadata | `project:{projectId}:meta` | 10 mins | Project updated / Member invited |
| Board Columns & Order | `board:{boardId}:structure` | 15 mins | Board columns changed |
| Board Task List | `board:{boardId}:tasks` | 2 mins | Task created, deleted, moved |
| User Profile Summary | `user:{userId}:profile` | 30 mins | User profile update |
| Project Activity Trail | `project:{projectId}:activity:p{page}` | 30 secs | Activity logged |

---

## 3. Cache Invalidation Patterns

### 3.1 Cache-Aside (Lazy Loading) with Write-Through Invalidation
```javascript
export const getCachedBoardTasks = async (boardId) => {
  const cacheKey = `board:${boardId}:tasks`;

  // 1. Try fetching from Redis
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Cache miss: Read from MongoDB
  const tasks = await Task.find({ board: boardId }).populate('assignees');

  // 3. Populate Redis with TTL
  await redisClient.set(cacheKey, JSON.stringify(tasks), 'EX', 120);

  return tasks;
};
```

### 3.2 Targeted Invalidation on Mutation
When any task is created, updated, or reordered, only the affected board's cache key is purged:
```javascript
export const invalidateBoardCache = async (boardId, projectId) => {
  const pipeline = redisClient.pipeline();
  pipeline.del(`board:${boardId}:tasks`);
  pipeline.del(`board:${boardId}:structure`);
  pipeline.del(`project:${projectId}:activity:p1`);
  await pipeline.exec();
};
```

---

## 4. Cache Stampede & Thundering Herd Prevention

To prevent massive simultaneous database queries when a popular board cache expires:
1. **Probabilistic Early Expiration (XFetch Algorithm)**: Recomputes cache value slightly before expiration based on read frequency and computation time.
2. **Distributed Mutex Lock (Redlock)**: Ensures only one worker thread queries MongoDB on cache miss while other requests await the cached result.
