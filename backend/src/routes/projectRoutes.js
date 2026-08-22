import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  inviteMember,
  updateMemberRole,
  removeMember,
  getProjectActivity,
  getRolePermissions,
  updateRolePermissions,
  resetRolePermissions,
} from '../controllers/projectController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireProjectRole } from '../middleware/rbacMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  createProjectSchema,
  updateProjectSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from '../utils/validators.js';

const router = Router();

// All project routes require authentication
router.use(authenticate);

// Projects listing & creation
router.get('/', getProjects);
router.post('/', validate(createProjectSchema), createProject);

// Single project access
router.get('/:projectId', requireProjectRole(['viewer', 'member', 'admin', 'owner']), getProjectById);
router.patch('/:projectId', requireProjectRole(['admin', 'owner']), validate(updateProjectSchema), updateProject);
router.delete('/:projectId', requireProjectRole(['admin', 'owner']), deleteProject);

// Granular Role Permissions Matrix
router.get('/:projectId/permissions', requireProjectRole(['viewer', 'member', 'admin', 'owner']), getRolePermissions);
router.put('/:projectId/permissions', requireProjectRole(['admin', 'owner']), updateRolePermissions);
router.post('/:projectId/permissions/reset', requireProjectRole(['admin', 'owner']), resetRolePermissions);

// Project member management
router.post('/:projectId/members', requireProjectRole(['admin', 'owner']), validate(inviteMemberSchema), inviteMember);
router.patch('/:projectId/members/:userId', requireProjectRole(['admin', 'owner']), validate(updateMemberRoleSchema), updateMemberRole);
router.delete('/:projectId/members/:userId', requireProjectRole(['admin', 'owner']), removeMember);

// Activity trail
router.get('/:projectId/activity', requireProjectRole(['viewer', 'member', 'admin', 'owner']), getProjectActivity);

export default router;
