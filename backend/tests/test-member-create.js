const BASE_URL = 'http://localhost:5000/api/v1';

async function testMemberPermission() {
  console.log('Testing Member Role Task Creation Permission...');

  // 1. Login as Sarah (Project Owner of E-Commerce Redesign)
  const sarahLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sarah@example.com', password: 'password123' }),
  });
  const sarahLoginData = await sarahLoginRes.json();
  const sarahToken = sarahLoginData.data?.tokens?.accessToken;
  const sarahHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sarahToken}`,
  };

  // Get Sarah's projects
  const sarahProjectsRes = await fetch(`${BASE_URL}/projects`, { headers: sarahHeaders });
  const sarahProjectsData = await sarahProjectsRes.json();
  const projectList = sarahProjectsData.data?.items || sarahProjectsData.data || [];
  const ecomProject = projectList.find(p => p.key === 'ECOMM') || projectList[0];
  console.log('Found Project ID:', ecomProject?._id, 'Name:', ecomProject?.name, 'Owner:', ecomProject?.owner?.email || ecomProject?.owner);

  // Get ECOMM boards
  const boardsRes = await fetch(`${BASE_URL}/boards/project/${ecomProject._id}`, { headers: sarahHeaders });
  const boardsData = await boardsRes.json();
  const ecomBoardId = boardsData.data.boards[0]._id;
  console.log('ECOMM Board ID:', ecomBoardId);

  // 2. Set Member permissions: createTasks = false
  const getPermsRes = await fetch(`${BASE_URL}/projects/${ecomProject._id}/permissions`, { headers: sarahHeaders });
  const getPermsData = await getPermsRes.json();
  const currentPerms = getPermsData.data.permissions;

  const newPerms = {
    ...currentPerms,
    member: {
      ...currentPerms.member,
      createTasks: false,
    }
  };

  const updatePermsRes = await fetch(`${BASE_URL}/projects/${ecomProject._id}/permissions`, {
    method: 'PUT',
    headers: sarahHeaders,
    body: JSON.stringify({ permissions: newPerms }),
  });
  const updatePermsData = await updatePermsRes.json();
  console.log('Updated ECOMM Member createTasks:', updatePermsData.data.permissions.member.createTasks);

  // 3. Login as John (who is Member in ECOMM project)
  const johnLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'john@example.com', password: 'password123' }),
  });
  const johnLoginData = await johnLoginRes.json();
  const johnToken = johnLoginData.data?.tokens?.accessToken;
  const johnHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${johnToken}`,
  };

  // 4. John attempts to create task on ECOMM board
  const johnTaskRes = await fetch(`${BASE_URL}/tasks/board/${ecomBoardId}`, {
    method: 'POST',
    headers: johnHeaders,
    body: JSON.stringify({
      title: 'Task by John should be rejected',
      status: 'todo',
    }),
  });
  const johnTaskData = await johnTaskRes.json();
  console.log('John task creation status:', johnTaskRes.status, 'Response:', johnTaskData);

  // 5. Sarah attempts to create task on ECOMM board (Owner)
  const sarahTaskRes = await fetch(`${BASE_URL}/tasks/board/${ecomBoardId}`, {
    method: 'POST',
    headers: sarahHeaders,
    body: JSON.stringify({
      title: 'Task by Sarah (Owner) allowed',
      status: 'todo',
    }),
  });
  const sarahTaskData = await sarahTaskRes.json();
  console.log('Sarah task creation status:', sarahTaskRes.status, 'Response success:', sarahTaskData.success);
}

testMemberPermission();
