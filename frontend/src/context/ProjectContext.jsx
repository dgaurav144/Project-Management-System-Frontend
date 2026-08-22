import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export const DEFAULT_ROLE_PERMISSIONS = {
  admin: {
    viewTasks: true,
    createTasks: true,
    editTasks: true,
    deleteTasks: true,
    moveTasks: true,
    createComments: true,
    deleteComments: true,
    manageBoards: true,
    inviteMembers: true,
  },
  member: {
    viewTasks: true,
    createTasks: true,
    editTasks: true,
    deleteTasks: false,
    moveTasks: true,
    createComments: true,
    deleteComments: false,
    manageBoards: false,
    inviteMembers: false,
  },
  viewer: {
    viewTasks: true,
    createTasks: false,
    editTasks: false,
    deleteTasks: false,
    moveTasks: false,
    createComments: true,
    deleteComments: false,
    manageBoards: false,
    inviteMembers: false,
  },
};

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProjectState] = useState(() => {
    try {
      const saved = localStorage.getItem('pulseflow_active_project_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [projectSettingsModalOpen, setProjectSettingsModalOpen] = useState(false);

  const setActiveProject = (projectOrUpdater) => {
    setActiveProjectState((prev) => {
      const next = typeof projectOrUpdater === 'function' ? projectOrUpdater(prev) : projectOrUpdater;
      if (next && next._id) {
        localStorage.setItem('pulseflow_active_project_id', next._id);
        localStorage.setItem('pulseflow_active_project_data', JSON.stringify(next));
      } else if (next === null) {
        localStorage.removeItem('pulseflow_active_project_id');
        localStorage.removeItem('pulseflow_active_project_data');
      }
      return next;
    });
  };

  const fetchProjects = useCallback(async (selectProjectId = null) => {
    if (!user) {
      setProjects([]);
      setActiveProject(null);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/projects');
      const projectList = res.data.data || [];
      setProjects(projectList);

      if (projectList.length > 0) {
        const savedId = selectProjectId || localStorage.getItem('pulseflow_active_project_id');
        const found = projectList.find((p) => p._id === savedId);
        if (found) {
          setActiveProject(found);
        } else {
          setActiveProject(projectList[0]);
        }
      } else {
        setActiveProject(null);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const createProject = async (projectData) => {
    try {
      const res = await api.post('/projects', projectData);
      const newProject = res.data.data.project;
      toast.success(`Project "${newProject.name}" created!`);
      await fetchProjects(newProject._id);
      setCreateProjectModalOpen(false);
      return { success: true, project: newProject };
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to create project. Please verify inputs.');
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const updateProject = async (projectId, updates) => {
    try {
      const res = await api.patch(`/projects/${projectId}`, updates);
      const updated = res.data.data.project;
      setProjects((prev) => prev.map((p) => (p._id === projectId ? { ...p, ...updated } : p)));
      if (activeProject?._id === projectId) {
        setActiveProject((prev) => ({ ...prev, ...updated }));
      }
      toast.success('Project settings updated');
      return { success: true, project: updated };
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to update project settings');
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const deleteProject = async (projectId) => {
    try {
      await api.delete(`/projects/${projectId}`);
      toast.success('Project deleted successfully');
      setProjectSettingsModalOpen(false);
      const remaining = projects.filter((p) => p._id !== projectId);
      setProjects(remaining);
      if (activeProject?._id === projectId) {
        setActiveProject(remaining[0] || null);
      }
      return { success: true };
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to delete project');
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const inviteMember = async (email, role = 'member') => {
    if (!activeProject) return { success: false };
    try {
      const res = await api.post(`/projects/${activeProject._id}/members`, { email, role });
      const updatedProject = res.data.data.project;
      if (updatedProject && updatedProject._id) {
        setActiveProject(updatedProject);
        setProjects((prev) =>
          prev.map((p) => (p._id === updatedProject._id ? updatedProject : p))
        );
      } else {
        await fetchProjects(activeProject._id);
      }
      toast.success(`Invited ${email} as ${role}!`);
      return { success: true };
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to invite member');
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const updateMemberRole = async (userId, newRole) => {
    if (!activeProject) return { success: false };
    try {
      const res = await api.patch(`/projects/${activeProject._id}/members/${userId}`, {
        role: newRole,
      });
      const updatedProject = res.data.data.project;
      if (updatedProject && updatedProject._id) {
        setActiveProject(updatedProject);
        setProjects((prev) =>
          prev.map((p) => (p._id === updatedProject._id ? updatedProject : p))
        );
      } else {
        await fetchProjects(activeProject._id);
      }
      toast.success('Member role updated');
      return { success: true };
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to update member role');
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const removeMember = async (userId) => {
    if (!activeProject) return { success: false };
    try {
      const res = await api.delete(`/projects/${activeProject._id}/members/${userId}`);
      const updatedProject = res.data.data.project;
      if (updatedProject && updatedProject._id) {
        setActiveProject(updatedProject);
        setProjects((prev) =>
          prev.map((p) => (p._id === updatedProject._id ? updatedProject : p))
        );
      } else {
        await fetchProjects(activeProject._id);
      }
      toast.success('Member removed');
      return { success: true };
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to remove member');
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const updateRolePermissions = async (rolePermissions) => {
    if (!activeProject) return { success: false };
    try {
      const res = await api.put(`/projects/${activeProject._id}/permissions`, {
        permissions: rolePermissions,
      });
      const updatedPerms = res.data.data.permissions;
      setActiveProject((prev) => ({ ...prev, rolePermissions: updatedPerms }));
      setProjects((prev) =>
        prev.map((p) => (p._id === activeProject._id ? { ...p, rolePermissions: updatedPerms } : p))
      );
      toast.success('Role permissions saved');
      return { success: true, permissions: updatedPerms };
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to update permissions');
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const resetRolePermissions = async () => {
    if (!activeProject) return { success: false };
    try {
      const res = await api.post(`/projects/${activeProject._id}/permissions/reset`);
      const resetPerms = res.data.data.permissions;
      setActiveProject((prev) => ({ ...prev, rolePermissions: resetPerms }));
      setProjects((prev) =>
        prev.map((p) => (p._id === activeProject._id ? { ...p, rolePermissions: resetPerms } : p))
      );
      toast.success('Permissions reset to system defaults');
      return { success: true, permissions: resetPerms };
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to reset permissions');
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const getUserRole = (project = activeProject) => {
    if (!user || !project) return 'viewer';
    if (user.role === 'admin') return 'admin';
    const uid = (user._id || user.id)?.toString();
    const ownerId = (project.owner?._id || project.owner)?.toString();
    if (uid && ownerId && uid === ownerId) {
      return 'owner';
    }
    const member = project.members?.find((m) => {
      const mId = (m.user?._id || m.user)?.toString();
      return mId && uid && mId === uid;
    });
    return member?.role || 'viewer';
  };

  const hasPermission = (permissionKey, project = activeProject) => {
    if (!user || !project) return false;
    const role = getUserRole(project);
    if (role === 'owner' || role === 'admin' || user.role === 'admin') return true;
    if (!role) return false;

    const matrix = project.rolePermissions || DEFAULT_ROLE_PERMISSIONS;
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role] || {};
    const rolePerms = { ...defaultPerms, ...(matrix?.[role] || {}) };
    return rolePerms[permissionKey] === true;
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        loading,
        fetchProjects,
        createProject,
        updateProject,
        deleteProject,
        inviteMember,
        updateMemberRole,
        removeMember,
        getUserRole,
        hasPermission,
        updateRolePermissions,
        resetRolePermissions,
        membersModalOpen,
        setMembersModalOpen,
        createProjectModalOpen,
        setCreateProjectModalOpen,
        projectSettingsModalOpen,
        setProjectSettingsModalOpen,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};
