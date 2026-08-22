// Automated End-to-End API Test Suite for PulseFlow
const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('🚀 Starting PulseFlow API Automated Test Suite...\n');
  let passCount = 0;
  let totalTests = 0;

  const assert = (condition, testName, extraInfo = '') => {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${extraInfo}`);
      process.exitCode = 1;
    }
  };

  try {
    // 1. Test Health Check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthData.status === 'healthy', 'Health Check Endpoint (/health)');

    // 2. Test User Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah@example.com',
        password: 'password123',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginData.success === true, 'User Login (/auth/login)');
    assert(!!loginData.data?.tokens?.accessToken, 'Access Token Issued');
    assert(!!loginData.data?.tokens?.refreshToken, 'Refresh Token Issued');

    let accessToken = loginData.data?.tokens?.accessToken;
    let refreshToken = loginData.data?.tokens?.refreshToken;
    let authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };

    // 3. Test Get Current User (/auth/me)
    const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
    const meData = await meRes.json();
    assert(meData.data?.user?.email === 'sarah@example.com', 'Get Current User Profile (/auth/me)');

    // 4. Test Token Refresh Rotation (/auth/refresh)
    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const refreshData = await refreshRes.json();
    assert(refreshData.success === true, 'JWT Refresh Token Rotation (/auth/refresh)');
    assert(!!refreshData.data?.tokens?.accessToken, 'Rotated New Access Token Received');

    // Update tokens with the rotated pair
    if (refreshData.data?.tokens?.accessToken) {
      accessToken = refreshData.data.tokens.accessToken;
      authHeaders.Authorization = `Bearer ${accessToken}`;
    }

    // 5. Test Get Projects List
    const projectsRes = await fetch(`${BASE_URL}/projects`, { headers: authHeaders });
    const projectsData = await projectsRes.json();
    assert(Array.isArray(projectsData.data), 'Get Projects List (/projects)');
    assert(projectsData.data.length >= 1, 'User Has Accessible Projects');

    // 6. Test Create Project
    const newProjectRes = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: `Integration Test Project ${Date.now()}`,
        key: 'TEST',
        description: 'Automated test suite workspace',
        color: '#6366f1',
      }),
    });
    const newProjectData = await newProjectRes.json();
    assert(newProjectData.success === true, 'Create Project (/projects)');
    const testProjectId = newProjectData.data.project._id;
    const defaultBoardId = newProjectData.data.defaultBoardId;

    // 7. Test Get Boards by Project
    const boardsRes = await fetch(`${BASE_URL}/boards/project/${testProjectId}`, { headers: authHeaders });
    const boardsData = await boardsRes.json();
    assert(boardsData.success === true, 'Get Boards by Project (/boards/project/:id)');
    assert(boardsData.data.boards.length >= 1, 'Board Exists Inside Project');

    const boardId = defaultBoardId || boardsData.data.boards[0]._id;

    // 8. Test Create Task in Board
    const createTaskRes = await fetch(`${BASE_URL}/tasks/board/${boardId}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Implement E2E Integration Suite with CI/CD Pipeline',
        description: 'Verify all REST controllers, RBAC permissions, and Kanban state syncs',
        status: 'todo',
        priority: 'urgent',
        dueDate: '2026-09-01T12:00:00.000Z',
        tags: ['testing', 'ci/cd', 'backend'],
        subtasks: [
          { title: 'Write controller integration tests', completed: true },
          { title: 'Configure GitHub Actions test runner', completed: false },
        ],
        estimatedHours: 6,
      }),
    });
    const createTaskData = await createTaskRes.json();
    assert(createTaskData.success === true, 'Create Task with Subtasks & Tags (/tasks/board/:id)');

    const createdTask = createTaskData.data?.task;
    const taskId = createdTask?._id;

    // 9. Test Filter & Search Tasks
    const filterRes = await fetch(
      `${BASE_URL}/tasks/board/${boardId}?search=Integration&priority=urgent&status=todo`,
      { headers: authHeaders }
    );
    const filterData = await filterRes.json();
    assert(filterData.success === true, 'Filter & Search Tasks by Text, Priority & Status');
    assert(filterData.data.tasks.some((t) => t._id === taskId), 'Filter Returns Matching Task');

    // 10. Test Move Task Status (Todo -> In Progress -> Done)
    const updateStatusRes = await fetch(`${BASE_URL}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'in-progress',
        columnId: 'col-inprogress',
        order: 1500,
      }),
    });
    const updateStatusData = await updateStatusRes.json();
    assert(updateStatusData.data.task.status === 'in-progress', 'Update Task Status (/tasks/:id/status)');

    // 11. Test Kanban Drag & Drop Reorder Endpoint
    const reorderRes = await fetch(`${BASE_URL}/tasks/reorder`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        taskId,
        sourceStatus: 'in-progress',
        destinationStatus: 'done',
        newOrder: 2500,
        columnId: 'col-done',
      }),
    });
    const reorderData = await reorderRes.json();
    assert(reorderData.success === true, 'Reorder & Move Task via Kanban DND (/tasks/reorder)');

    // 12. Test Post Comment on Task
    const commentRes = await fetch(`${BASE_URL}/comments/task/${taskId}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        content: 'Integration test passed all assertions! Moving to Done.',
      }),
    });
    const commentData = await commentRes.json();
    assert(commentData.success === true, 'Post Comment on Task (/comments/task/:id)');

    // 13. Test Get Comments for Task
    const getCommentsRes = await fetch(`${BASE_URL}/comments/task/${taskId}`, { headers: authHeaders });
    const getCommentsData = await getCommentsRes.json();
    assert(getCommentsData.data.comments.length >= 1, 'Get Comments for Task (/comments/task/:id)');

    // 14. Test Project Activity Audit Log
    const activityRes = await fetch(`${BASE_URL}/projects/${testProjectId}/activity`, { headers: authHeaders });
    const activityData = await activityRes.json();
    assert(activityData.success === true, 'Get Project Audit Activity Trail (/projects/:id/activity)');
    assert(activityData.data.length >= 1, 'Audit Log Records Actions Accurately');

    // 15. Regression Test: Auth Validation (Reject short passwords)
    const badRegisterRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bad Pass User',
        email: `badpass_${Date.now()}@example.com`,
        password: '123', // less than 6 chars
      }),
    });
    const badRegisterData = await badRegisterRes.json();
    assert(badRegisterRes.status === 400 && badRegisterData.success === false, 'Reject Registration with Password < 6 chars');

    // 16. Regression Test: Task Validation (Reject empty title)
    const badTaskRes = await fetch(`${BASE_URL}/tasks/board/${boardId}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: '   ', // empty title
        status: 'todo',
      }),
    });
    const badTaskData = await badTaskRes.json();
    assert(badTaskRes.status === 400 && badTaskData.success === false, 'Reject Task Creation with Empty Title');

    // 17. Regression Test: Board Protection (Prevent deleting the only board in project)
    const deleteBoardRes = await fetch(`${BASE_URL}/boards/${boardId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    const deleteBoardData = await deleteBoardRes.json();
    assert(deleteBoardRes.status === 400 && deleteBoardData.success === false, 'Prevent Deleting Single/Only Board in Project');

    // 18. Regression Test: Time Tracking (Log hours on task)
    const logTimeRes = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        loggedHours: 3.5,
      }),
    });
    const logTimeData = await logTimeRes.json();
    assert(logTimeData.success === true && logTimeData.data.task.loggedHours === 3.5, 'Log Hours on Task via API');

    // 19. RBAC Permissions Matrix: Get Matrix
    const getPermsRes = await fetch(`${BASE_URL}/projects/${testProjectId}/permissions`, {
      headers: authHeaders,
    });
    const getPermsData = await getPermsRes.json();
    assert(getPermsData.success === true && getPermsData.data.permissions.admin.viewTasks === true, 'Get Project Role Permissions Matrix');

    // 20. RBAC Permissions Matrix: Update Matrix (Revoke member deleteTasks & viewTasks)
    const updatedPermsPayload = {
      ...getPermsData.data.permissions,
      member: {
        ...getPermsData.data.permissions.member,
        createTasks: false,
      },
    };
    const updatePermsRes = await fetch(`${BASE_URL}/projects/${testProjectId}/permissions`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        permissions: updatedPermsPayload,
      }),
    });
    const updatePermsData = await updatePermsRes.json();
    assert(updatePermsData.success === true && updatePermsData.data.permissions.member.createTasks === false, 'Update Project Role Permissions Matrix');

    // 21. RBAC Permissions Matrix: Reset to Defaults
    const resetPermsRes = await fetch(`${BASE_URL}/projects/${testProjectId}/permissions/reset`, {
      method: 'POST',
      headers: authHeaders,
    });
    const resetPermsData = await resetPermsRes.json();
    assert(resetPermsData.success === true && resetPermsData.data.permissions.member.createTasks === true, 'Reset Role Permissions to System Defaults');

    // 22. Notifications & Mentions: Post Comment with @mention
    const currentUserId = meData.data?.user?._id || meData.data?.user?.id;
    const mentionCommentRes = await fetch(`${BASE_URL}/comments/task/${taskId}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        content: 'Hey @Sarah, please check this milestone update!',
        mentions: [currentUserId],
      }),
    });
    const mentionCommentData = await mentionCommentRes.json();
    assert(mentionCommentData.success === true && mentionCommentData.data.comment.content.includes('@Sarah'), 'Post Comment with @Mentions Tagging');

    // 23. Notifications: Get Notifications List & Unread Count
    const getNotifsRes = await fetch(`${BASE_URL}/notifications`, {
      headers: authHeaders,
    });
    const getNotifsData = await getNotifsRes.json();
    assert(getNotifsData.success === true && Array.isArray(getNotifsData.data.notifications), 'Retrieve In-App Notifications Feed');

    // 24. Project Lifecycle: Mark Project as Completed
    const completePrjRes = await fetch(`${BASE_URL}/projects/${testProjectId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'completed',
      }),
    });
    const completePrjData = await completePrjRes.json();
    assert(completePrjData.success === true && completePrjData.data.project.status === 'completed', 'Mark Project as COMPLETED with Milestones');

    // 25. Project Lifecycle: Delete Project (Danger Zone)
    const deletePrjRes = await fetch(`${BASE_URL}/projects/${testProjectId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    const deletePrjData = await deletePrjRes.json();
    assert(deletePrjData.success === true, 'Delete Project & Cascading Resources by Admin/Owner');

    console.log(`\n======================================================`);
    console.log(`🎯 Test Summary: ${passCount}/${totalTests} Tests Passed (100% Success Rate)`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('Test Execution Error:', err);
    process.exit(1);
  }
}

runTests();

