import Project, { DEFAULT_ROLE_PERMISSIONS } from '../models/Project.js';
import Board from '../models/Board.js';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { logActivity } from '../utils/activityLogger.js';

export const createProject = async (req, res, next) => {
  try {
    const { name, description, key, color } = req.body;

    const projectKey = key || (name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'PRJ');

    const project = await Project.create({
      name,
      description,
      key: projectKey,
      color: color || '#6366f1',
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
    });

    // Create default board for this project
    const defaultBoard = await Board.create({
      name: 'Main Board',
      description: 'Default project board',
      project: project._id,
      isDefault: true,
      order: 0,
    });

    await logActivity({
      project: project._id,
      user: req.user._id,
      action: 'PROJECT_CREATED',
      details: `${req.user.name} created project "${project.name}"`,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    return ApiResponse.created(res, 'Project created successfully', {
      project: populatedProject,
      defaultBoardId: defaultBoard._id,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const { search, status = 'active', page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    // If not system admin, only show projects where user is owner or member
    if (req.user.role !== 'admin') {
      filter.$or = [{ owner: req.user._id }, { 'members.user': req.user._id }];
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        ...(filter.$or || []),
        { name: { $regex: search, $options: 'i' } },
        { key: { $regex: search, $options: 'i' } },
      ];
    }

    const totalItems = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Fetch task and board counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (prj) => {
        const boardCount = await Board.countDocuments({ project: prj._id });
        const taskCount = await Task.countDocuments({ project: prj._id });
        const completedTaskCount = await Task.countDocuments({ project: prj._id, status: 'done' });
        return {
          ...prj.toObject(),
          boardCount,
          taskCount,
          completedTaskCount,
        };
      })
    );

    return ApiResponse.paginated(res, 'Projects retrieved successfully', projectsWithCounts, {
      page: pageNum,
      limit: limitNum,
      totalItems,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const boards = await Board.find({ project: projectId }).sort({ order: 1 });
    const taskStats = {
      total: await Task.countDocuments({ project: projectId }),
      todo: await Task.countDocuments({ project: projectId, status: 'todo' }),
      inProgress: await Task.countDocuments({ project: projectId, status: 'in-progress' }),
      review: await Task.countDocuments({ project: projectId, status: 'review' }),
      done: await Task.countDocuments({ project: projectId, status: 'done' }),
    };

    return ApiResponse.success(res, 'Project retrieved successfully', {
      project,
      boards,
      taskStats,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, description, status, color } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const prevStatus = project.status;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (color) project.color = color;

    await project.save();

    let action = 'PROJECT_UPDATED';
    let details = `${req.user.name} updated project details`;
    if (status && status !== prevStatus) {
      action = 'PROJECT_STATUS_CHANGED';
      details = `${req.user.name} changed project status to ${status.toUpperCase()}`;
    }

    await logActivity({
      project: project._id,
      user: req.user._id,
      action,
      details,
      meta: { from: prevStatus, to: status },
    });

    const updated = await Project.findById(projectId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    return ApiResponse.success(res, 'Project updated successfully', { project: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Allowed for Owner, Project Admin, or System Admin
    const isOwner = project.owner.toString() === req.user._id.toString();
    const userMember = project.members.find((m) => m.user.toString() === req.user._id.toString());
    const isProjectAdmin = userMember?.role === 'admin';
    const isSystemAdmin = req.user.role === 'admin';

    if (!isOwner && !isProjectAdmin && !isSystemAdmin) {
      throw ApiError.forbidden('Only the Project Owner or Project Admin can delete this project');
    }

    // Cascade delete boards, tasks, comments, activity logs
    await Board.deleteMany({ project: projectId });
    await Task.deleteMany({ project: projectId });
    await Comment.deleteMany({ project: projectId });
    await ActivityLog.deleteMany({ project: projectId });
    await Project.findByIdAndDelete(projectId);

    return ApiResponse.success(res, 'Project and associated resources deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const inviteMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { email, role = 'member' } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!targetUser) {
      throw ApiError.notFound(`No registered user found with email "${email}". Please ask them to register first.`);
    }

    // Check if user is already a member or owner
    const isAlreadyMember = project.members.some(
      (m) => m.user.toString() === targetUser._id.toString()
    );

    if (isAlreadyMember || project.owner.toString() === targetUser._id.toString()) {
      throw ApiError.conflict('User is already a member of this project');
    }

    project.members.push({
      user: targetUser._id,
      role,
      joinedAt: new Date(),
    });

    await project.save();

    await logActivity({
      project: project._id,
      user: req.user._id,
      action: 'MEMBER_INVITED',
      details: `${req.user.name} invited ${targetUser.name} (${targetUser.email}) as ${role}`,
    });

    const updated = await Project.findById(projectId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    return ApiResponse.success(res, 'Member added to project successfully', {
      project: updated,
      members: updated.members,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    if (project.owner.toString() === userId) {
      throw ApiError.badRequest("Cannot change the project owner's role");
    }

    const member = project.members.find((m) => m.user.toString() === userId);
    if (!member) {
      throw ApiError.notFound('Member not found in this project');
    }

    const oldRole = member.role;
    member.role = role;
    await project.save();

    const targetUser = await User.findById(userId);

    await logActivity({
      project: project._id,
      user: req.user._id,
      action: 'MEMBER_ROLE_UPDATED',
      details: `${req.user.name} changed ${targetUser?.name || 'user'}'s role from ${oldRole} to ${role}`,
    });

    const updated = await Project.findById(projectId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    return ApiResponse.success(res, 'Member role updated successfully', {
      project: updated,
      members: updated.members,
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    if (project.owner.toString() === userId) {
      throw ApiError.badRequest('Cannot remove the project owner');
    }

    const memberIndex = project.members.findIndex((m) => m.user.toString() === userId);
    if (memberIndex === -1) {
      throw ApiError.notFound('Member not found in this project');
    }

    const targetUser = await User.findById(userId);
    project.members.splice(memberIndex, 1);
    await project.save();

    await logActivity({
      project: project._id,
      user: req.user._id,
      action: 'MEMBER_REMOVED',
      details: `${req.user.name} removed ${targetUser?.name || 'user'} from the project`,
    });

    const updated = await Project.findById(projectId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    return ApiResponse.success(res, 'Member removed from project successfully', {
      project: updated,
      members: updated.members,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectActivity = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const totalItems = await ActivityLog.countDocuments({ project: projectId });
    const activities = await ActivityLog.find({ project: projectId })
      .populate('user', 'name email avatar')
      .populate('task', 'title')
      .populate('board', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return ApiResponse.paginated(res, 'Project activity logs retrieved', activities, {
      page: pageNum,
      limit: limitNum,
      totalItems,
    });
  } catch (error) {
    next(error);
  }
};

export const getRolePermissions = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    const permissions = project.rolePermissions || DEFAULT_ROLE_PERMISSIONS;
    return ApiResponse.success(res, 'Role permissions retrieved', {
      permissions,
      defaultPermissions: DEFAULT_ROLE_PERMISSIONS,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRolePermissions = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { permissions } = req.body;

    if (!permissions || typeof permissions !== 'object') {
      throw ApiError.badRequest('Permissions object is required');
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Merge with defaults to ensure all required keys exist
    const updatedMatrix = {
      admin: { ...(DEFAULT_ROLE_PERMISSIONS.admin || {}), ...(permissions.admin || {}) },
      member: { ...(DEFAULT_ROLE_PERMISSIONS.member || {}), ...(permissions.member || {}) },
      viewer: { ...(DEFAULT_ROLE_PERMISSIONS.viewer || {}), ...(permissions.viewer || {}) },
    };

    project.rolePermissions = updatedMatrix;
    project.markModified('rolePermissions');
    await project.save();

    await logActivity({
      project: project._id,
      user: req.user._id,
      action: 'PERMISSIONS_UPDATED',
      details: `${req.user.name} updated the project role permissions matrix`,
    });

    return ApiResponse.success(res, 'Project role permissions updated successfully', {
      permissions: project.rolePermissions,
    });
  } catch (error) {
    next(error);
  }
};

export const resetRolePermissions = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    project.rolePermissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    project.markModified('rolePermissions');
    await project.save();

    await logActivity({
      project: project._id,
      user: req.user._id,
      action: 'PERMISSIONS_RESET',
      details: `${req.user.name} reset the project role permissions to defaults`,
    });

    return ApiResponse.success(res, 'Project role permissions reset to defaults', {
      permissions: project.rolePermissions,
    });
  } catch (error) {
    next(error);
  }
};
