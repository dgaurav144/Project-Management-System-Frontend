import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import api, { getErrorMessage } from '../services/api';
import { useProject } from './ProjectContext';
import { useToast } from './ToastContext';

const BoardContext = createContext(null);

export const BoardProvider = ({ children }) => {
  const { activeProject, hasPermission } = useProject();
  const toast = useToast();

  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoardState] = useState(() => {
    try {
      const saved = localStorage.getItem('pulseflow_active_board_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [tasks, setTasks] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Selected task for detailed modal
  const [selectedTask, setSelectedTask] = useState(null);

  // Create task modal state
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [createTaskDefaultStatus, setCreateTaskDefaultStatus] = useState('todo');

  // Create board modal state
  const [createBoardModalOpen, setCreateBoardModalOpen] = useState(false);

  // Activity Drawer state
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);

  // Tour Guide Modal state
  const [tourOpen, setTourOpen] = useState(false);

  // Filters and Sorting
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    assignee: '',
    dueDateFilter: '',
    sortBy: 'order',
    sortOrder: 'asc',
  });

  const setActiveBoard = (boardOrUpdater) => {
    setActiveBoardState((prev) => {
      const next = typeof boardOrUpdater === 'function' ? boardOrUpdater(prev) : boardOrUpdater;
      if (next && next._id) {
        localStorage.setItem('pulseflow_active_board_id', next._id);
        localStorage.setItem('pulseflow_active_board_data', JSON.stringify(next));
      } else if (next === null) {
        localStorage.removeItem('pulseflow_active_board_id');
        localStorage.removeItem('pulseflow_active_board_data');
      }
      return next;
    });
  };

  // Fetch Boards for Active Project
  const fetchBoards = useCallback(async (selectBoardId = null) => {
    if (!activeProject) {
      setBoards([]);
      setActiveBoard(null);
      return;
    }

    try {
      setLoadingBoards(true);
      const res = await api.get(`/boards/project/${activeProject._id}`);
      const rawData = res.data.data;
      const boardList = Array.isArray(rawData?.boards)
        ? rawData.boards
        : Array.isArray(rawData)
        ? rawData
        : [];
      setBoards(boardList);

      if (boardList.length > 0) {
        const savedId = selectBoardId || localStorage.getItem('pulseflow_active_board_id');
        const found = boardList.find((b) => b._id === savedId);
        if (found) {
          setActiveBoard(found);
        } else {
          const defaultBoard = boardList.find((b) => b.isDefault) || boardList[0];
          setActiveBoard(defaultBoard);
        }
      } else {
        setActiveBoard(null);
      }
    } catch (err) {
      console.error('Failed to fetch boards:', err);
    } finally {
      setLoadingBoards(false);
    }
  }, [activeProject]);

  useEffect(() => {
    fetchBoards();
  }, [activeProject]);

  // Fetch Tasks for Active Board
  const fetchTasks = useCallback(async () => {
    if (!activeBoard) {
      setTasks([]);
      return;
    }

    try {
      setLoadingTasks(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.priority) params.priority = filters.priority;
      if (filters.assignee) params.assignee = filters.assignee;
      if (filters.dueDateFilter) params.dueDateFilter = filters.dueDateFilter;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.sortOrder) params.sortOrder = filters.sortOrder;

      const res = await api.get(`/tasks/board/${activeBoard._id}`, { params });
      setTasks(res.data.data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  }, [activeBoard, filters]);

  useEffect(() => {
    fetchTasks();
  }, [activeBoard, filters]);

  // Board CRUD
  const createBoard = async (boardData) => {
    if (!activeProject) {
      toast.error('Please select a project first');
      return { success: false };
    }
    try {
      const res = await api.post(`/boards/project/${activeProject._id}`, boardData);
      const newBoard = res.data.data.board;
      toast.success(`Board "${newBoard.name}" created!`);
      await fetchBoards(newBoard._id);
      setCreateBoardModalOpen(false);
      return { success: true, board: newBoard };
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to create board. Please check board name.');
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const deleteBoard = async (boardId) => {
    try {
      await api.delete(`/boards/${boardId}`);
      toast.success('Board deleted');
      await fetchBoards();
      return { success: true };
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to delete board');
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  // Task CRUD & Optimistic Drag & Drop
  const createTask = async (taskData) => {
    if (!hasPermission('createTasks')) {
      toast.error('Your role does not have permission to create tasks in this workspace.');
      return { success: false, error: 'Permission denied' };
    }

    let targetBoard = activeBoard;

    // Ensure we have a valid board
    if (!targetBoard && activeProject) {
      if (boards.length > 0) {
        targetBoard = boards[0];
        setActiveBoard(boards[0]);
      } else {
        try {
          const res = await api.post(`/boards/project/${activeProject._id}`, {
            name: 'Sprint 1',
            description: 'Default board',
          });
          targetBoard = res.data.data.board;
          setBoards([targetBoard]);
          setActiveBoard(targetBoard);
        } catch (bErr) {
          const errMsg = getErrorMessage(bErr, 'Could not initialize board for project');
          toast.error(errMsg);
          return { success: false };
        }
      }
    }

    if (!targetBoard) {
      toast.error('Please create or select a project board before adding tasks.');
      return { success: false };
    }

    try {
      const res = await api.post(`/tasks/board/${targetBoard._id}`, taskData);
      const newTask = res.data.data.task;
      setTasks((prev) => [newTask, ...prev]);
      toast.success(`Task "${newTask.title}" created successfully!`);
      setCreateTaskModalOpen(false);
      return { success: true, task: newTask };
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to create task. Please check title and details.');
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const updateTask = async (taskId, updates) => {
    if (!hasPermission('editTasks')) {
      toast.error('Your role does not have permission to edit tasks in this workspace.');
      return { success: false, error: 'Permission denied' };
    }
    try {
      // Optimistically update local task state
      setTasks((prev) =>
        prev.map((t) =>
          (t._id || t.id)?.toString() === taskId?.toString() ? { ...t, ...updates } : t
        )
      );

      if ((selectedTask?._id || selectedTask?.id)?.toString() === taskId?.toString()) {
        setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
      }

      const res = await api.patch(`/tasks/${taskId}`, updates);
      const updated = res.data.data.task;

      setTasks((prev) =>
        prev.map((t) =>
          (t._id || t.id)?.toString() === taskId?.toString() ? { ...t, ...updated } : t
        )
      );

      if ((selectedTask?._id || selectedTask?.id)?.toString() === taskId?.toString()) {
        setSelectedTask((prev) => (prev ? { ...prev, ...updated } : null));
      }

      toast.success('Task updated');
      return { success: true, task: updated };
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to update task');
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const deleteTask = async (taskId) => {
    if (!hasPermission('deleteTasks')) {
      toast.error('Your role does not have permission to delete tasks in this workspace.');
      return { success: false, error: 'Permission denied' };
    }
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => (t._id || t.id)?.toString() !== taskId?.toString()));
      if ((selectedTask?._id || selectedTask?.id)?.toString() === taskId?.toString()) {
        setSelectedTask(null);
      }
      toast.success('Task removed');
      return { success: true };
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to delete task');
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  // Optimistic Move & Reorder
  const moveTask = async (taskId, targetStatus, newOrder = null, targetColumnId = null) => {
    if (!hasPermission('moveTasks')) {
      toast.error('Your role does not have permission to move tasks in this workspace.');
      return;
    }
    const originalTasks = [...tasks];
    const task = tasks.find((t) => (t._id || t.id)?.toString() === taskId?.toString());
    if (!task) {
      console.warn('moveTask: task not found in state:', taskId);
      return;
    }

    const previousStatus = task.status;
    const computedColumnId =
      targetColumnId ||
      (targetStatus === 'todo'
        ? 'col-todo'
        : targetStatus === 'in-progress'
        ? 'col-inprogress'
        : targetStatus === 'review'
        ? 'col-review'
        : 'col-done');

    // Optimistically update UI
    setTasks((prev) =>
      prev.map((t) => {
        if ((t._id || t.id)?.toString() === taskId?.toString()) {
          return {
            ...t,
            status: targetStatus,
            columnId: computedColumnId,
            order: newOrder !== null ? newOrder : t.order,
          };
        }
        return t;
      })
    );

    // Trigger confetti if task moved to 'done'
    if (targetStatus === 'done' && previousStatus !== 'done') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#10b981', '#38bdf8', '#fbbf24'],
        });
      } catch {}
    }

    try {
      await api.post('/tasks/reorder', {
        taskId,
        sourceStatus: previousStatus,
        destinationStatus: targetStatus,
        newOrder: newOrder || Date.now(),
        columnId: computedColumnId,
      });
    } catch (err) {
      console.error('Failed to sync task reorder:', err);
      // Revert optimistic update on failure
      setTasks(originalTasks);
      const msg = getErrorMessage(err, 'Could not save task move. Reverted changes.');
      toast.error(msg);
    }
  };

  const openCreateTask = (status = 'todo') => {
    setCreateTaskDefaultStatus(status);
    setCreateTaskModalOpen(true);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      priority: '',
      assignee: '',
      dueDateFilter: '',
      sortBy: 'order',
      sortOrder: 'asc',
    });
  };

  const openTour = () => setTourOpen(true);
  const closeTour = () => setTourOpen(false);

  return (
    <BoardContext.Provider
      value={{
        boards,
        activeBoard,
        setActiveBoard,
        tasks,
        loadingBoards,
        loadingTasks,
        fetchBoards,
        fetchTasks,
        createBoard,
        deleteBoard,
        createTask,
        updateTask,
        deleteTask,
        moveTask,
        selectedTask,
        setSelectedTask,
        createTaskModalOpen,
        setCreateTaskModalOpen,
        createTaskDefaultStatus,
        openCreateTask,
        createBoardModalOpen,
        setCreateBoardModalOpen,
        filters,
        setFilters,
        clearFilters,
        activityDrawerOpen,
        setActivityDrawerOpen,
        tourOpen,
        openTour,
        closeTour,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within BoardProvider');
  }
  return context;
};
