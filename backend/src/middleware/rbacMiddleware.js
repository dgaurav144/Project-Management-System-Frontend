import { ApiError } from '../utils/apiError.js';
import Project, { DEFAULT_ROLE_PERMISSIONS } from '../models/Project.js';
import Board from '../models/Board.js';
import Task from '../models/Task.js';

const ROLE_HIERARCHY = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export const requireSystemAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(ApiError.forbidden('Requires system administrator privileges'));
  }
  next();
};

/**
 * Middleware to ensure the authenticated user has at least the required role in the project.
 * @param {Array<string>|string} allowedRoles - Minimum role or list of allowed roles
 */
export const requireProjectRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      let projectId = req.params.projectId || req.body.projectId || req.query.projectId;

      // If boardId is provided instead of projectId, resolve board's project
      if (!projectId && req.params.boardId) {
        const board = await Board.findById(req.params.boardId);
        if (board) {
          projectId = board.project.toString();
          req.board = board;
        }
      }

      // If taskId is provided, resolve task's project
      if (!projectId && req.params.taskId) {
        const task = await Task.findById(req.params.taskId);
        if (task) {
          projectId = task.project.toString();
          req.task = task;
        }
      }

      if (!projectId) {
        return next(ApiError.badRequest('Project ID is required to verify permissions'));
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return next(ApiError.notFound('Project not found'));
      }

      // Attach project to request
      req.project = project;

      // System admins bypass project role checks
      if (req.user.role === 'admin') {
        req.userProjectRole = 'admin';
        return next();
      }

      // Check if user is owner
      if (project.owner.toString() === req.user._id.toString()) {
        req.userProjectRole = 'owner';
        return next();
      }

      // Check member list
      const memberRecord = project.members.find(
        (m) => m.user.toString() === req.user._id.toString()
      );

      if (!memberRecord) {
        return next(ApiError.forbidden('You are not a member of this project'));
      }

      req.userProjectRole = memberRecord.role;

      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      // Check if user's role satisfies any of allowed roles or hierarchy
      const hasPermission = rolesArray.some((role) => {
        const requiredLevel = ROLE_HIERARCHY[role] || 1;
        const userLevel = ROLE_HIERARCHY[memberRecord.role] || 1;
        return userLevel >= requiredLevel;
      });

      if (!hasPermission) {
        return next(ApiError.forbidden(`Requires ${rolesArray.join(' or ')} permission level`));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Granular Permission Middleware:
 * Checks if the user's role has the specific capability (e.g. 'viewTasks', 'createTasks', 'moveTasks')
 * configured in the project's rolePermissions matrix.
 */
export const requireProjectPermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      let projectId = req.params.projectId || req.body.projectId || req.query.projectId;

      // Resolve from boardId
      if (!projectId && req.params.boardId) {
        const board = await Board.findById(req.params.boardId);
        if (board) {
          projectId = board.project.toString();
          req.board = board;
        }
      }

      // Resolve from taskId (params or body)
      const targetTaskId = req.params.taskId || req.body.taskId;
      if (!projectId && targetTaskId) {
        const task = await Task.findById(targetTaskId);
        if (task) {
          projectId = task.project.toString();
          req.task = task;
        }
      }

      if (!projectId) {
        return next(ApiError.badRequest('Project ID is required to verify permissions'));
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return next(ApiError.notFound('Project not found'));
      }

      req.project = project;

      // System admins bypass all permission checks
      if (req.user.role === 'admin') {
        req.userProjectRole = 'admin';
        return next();
      }

      // Workspace owner has full permission across the workspace
      if (project.owner.toString() === req.user._id.toString()) {
        req.userProjectRole = 'owner';
        return next();
      }

      // Check member existence
      const memberRecord = project.members.find(
        (m) => m.user.toString() === req.user._id.toString()
      );

      if (!memberRecord) {
        return next(ApiError.forbidden('You are not a member of this project'));
      }

      const userRole = memberRecord.role;
      req.userProjectRole = userRole;

      // Project admins & owners always bypass
      if (userRole === 'admin' || userRole === 'owner') {
        return next();
      }

      // Lookup role permissions matrix with system defaults fallback
      const matrix = project.rolePermissions || {};
      const defaultPerms = DEFAULT_ROLE_PERMISSIONS[userRole] || {};
      const rolePerms = { ...defaultPerms, ...(matrix[userRole] || {}) };

      // Check if permission is granted (boolean true)
      if (rolePerms[permissionKey] !== true) {
        return next(
          ApiError.forbidden(
            `Your role (${userRole}) does not have permission to "${permissionKey}" in this workspace`
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

