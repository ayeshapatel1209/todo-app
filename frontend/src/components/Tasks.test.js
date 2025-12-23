import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Tasks from './Tasks';
import API from '../api';

jest.mock('../api');
global.confirm = jest.fn();

describe('Tasks Component', () => {
  const mockOnLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    API.get.mockResolvedValue({ data: [] });
  });

  // ============================================
  // RENDERING TESTS
  // ============================================

  test('renders tasks component', async () => {
    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('My Tasks')).toBeInTheDocument();
      expect(screen.getByText('Add New Task')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  test('loads and displays tasks', async () => {
    const mockTasks = [
      {
        id: 1,
        title: 'Task 1',
        description: 'Description 1',
        completed: false,
        created_at: '2024-01-01T00:00:00',
      },
      {
        id: 2,
        title: 'Task 2',
        description: 'Description 2',
        completed: true,
        created_at: '2024-01-02T00:00:00',
      },
    ];

    API.get.mockResolvedValueOnce({ data: mockTasks });

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });
  });

  test('displays empty state when no tasks exist', async () => {
    API.get.mockResolvedValueOnce({ data: [] });

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('No tasks yet. Create your first task above!')).toBeInTheDocument();
    });
  });

  test('displays loading state while fetching tasks', async () => {
    API.get.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<Tasks onLogout={mockOnLogout} />);

    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  test('displays task count in header', async () => {
    const mockTasks = [
      { id: 1, title: 'Task 1', description: '', completed: false, created_at: '2024-01-01T00:00:00' },
      { id: 2, title: 'Task 2', description: '', completed: false, created_at: '2024-01-02T00:00:00' },
      { id: 3, title: 'Task 3', description: '', completed: true, created_at: '2024-01-03T00:00:00' },
    ];

    API.get.mockResolvedValueOnce({ data: mockTasks });

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText(/3 tasks total/i)).toBeInTheDocument();
      expect(screen.getByText(/2 pending/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // TASK CREATION TESTS
  // ============================================

  test('creates a new task with title and description', async () => {
    const newTask = {
      id: 1,
      title: 'New Task',
      description: 'New Description',
      completed: false,
      created_at: '2024-01-01T00:00:00',
    };

    API.get.mockResolvedValueOnce({ data: [] });
    API.post.mockResolvedValueOnce({ data: newTask });

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Task title'), {
      target: { value: 'New Task' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Task description/i), {
      target: { value: 'New Description' },
    });

    fireEvent.click(screen.getByText('Add Task'));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/tasks', {
        title: 'New Task',
        description: 'New Description',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('New Task')).toBeInTheDocument();
    });
  });

  test('creates a new task with only title', async () => {
    const newTask = {
      id: 1,
      title: 'Task Without Description',
      description: null,
      completed: false,
      created_at: '2024-01-01T00:00:00',
    };

    API.get.mockResolvedValueOnce({ data: [] });
    API.post.mockResolvedValueOnce({ data: newTask });

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Task title'), {
      target: { value: 'Task Without Description' },
    });

    fireEvent.click(screen.getByText('Add Task'));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/tasks', {
        title: 'Task Without Description',
        description: null,
      });
    });
  });

  test('shows error when trying to create task without title', async () => {
    API.get.mockResolvedValueOnce({ data: [] });

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Task'));

    await waitFor(() => {
      expect(screen.getByText('Task title is required')).toBeInTheDocument();
    });

    expect(API.post).not.toHaveBeenCalled();
  });

  test('clears form after successful task creation', async () => {
    const newTask = {
      id: 1,
      title: 'New Task',
      description: 'New Description',
      completed: false,
      created_at: '2024-01-01T00:00:00',
    };

    API.get.mockResolvedValueOnce({ data: [] });
    API.post.mockResolvedValueOnce({ data: newTask });

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();
    });

    const titleInput = screen.getByPlaceholderText('Task title');
    const descriptionInput = screen.getByPlaceholderText(/Task description/i);

    fireEvent.change(titleInput, { target: { value: 'New Task' } });
    fireEvent.change(descriptionInput, { target: { value: 'New Description' } });

    fireEvent.click(screen.getByText('Add Task'));

    await waitFor(() => {
      expect(titleInput.value).toBe('');
      expect(descriptionInput.value).toBe('');
    });
  });

  test('shows error when task creation fails', async () => {
    API.get.mockResolvedValueOnce({ data: [] });
    API.post.mockRejectedValueOnce(new Error('Failed to create'));

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Task title'), {
      target: { value: 'New Task' },
    });

    fireEvent.click(screen.getByText('Add Task'));

    await waitFor(() => {
      expect(screen.getByText('Failed to add task')).toBeInTheDocument();
    });
  });

  // ============================================
  // TASK COMPLETION TESTS
  // ============================================

  test('toggles task completion from incomplete to complete', async () => {
    const mockTask = {
      id: 1,
      title: 'Test Task',
      description: 'Description',
      completed: false,
      created_at: '2024-01-01T00:00:00',
    };

    API.get.mockResolvedValueOnce({ data: [mockTask] });
    API.put.mockResolvedValueOnce({ data: { ...mockTask, completed: true } });

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(API.put).toHaveBeenCalledWith('/tasks/1', { completed: true });
    });

    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });
  });

  test('toggles task completion from complete to incomplete', async () => {
    const mockTask = {
      id: 1,
      title: 'Completed Task',
      description: 'Description',
      completed: true,
      created_at: '2024-01-01T00:00:00',
    };

    API.get.mockResolvedValueOnce({ data: [mockTask] });
    API.put.mockResolvedValueOnce({ data: { ...mockTask, completed: false } });

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('Completed Task')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(API.put).toHaveBeenCalledWith('/tasks/1', { completed: false });
    });

    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });
  });

  test('shows error when toggling completion fails', async () => {
    const mockTask = {
      id: 1,
      title: 'Test Task',
      description: 'Description',
      completed: false,
      created_at: '2024-01-01T00:00:00',
    };

    API.get.mockResolvedValueOnce({ data: [mockTask] });
    API.put.mockRejectedValueOnce(new Error('Update failed'));

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox'));

    await waitFor(() => {
      expect(screen.getByText('Failed to update task')).toBeInTheDocument();
    });
  });

  // ============================================
  // TASK DELETION TESTS
  // ============================================

  test('deletes a task when confirmed', async () => {
    const mockTask = {
      id: 1,
      title: 'Test Task',
      description: 'Description',
      completed: false,
      created_at: '2024-01-01T00:00:00',
    };

    API.get.mockResolvedValueOnce({ data: [mockTask] });
    API.delete.mockResolvedValueOnce({ data: { message: 'Task deleted' } });
    global.confirm.mockReturnValueOnce(true);

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this task?');

    await waitFor(() => {
      expect(API.delete).toHaveBeenCalledWith('/tasks/1');
    });

    await waitFor(() => {
      expect(screen.queryByText('Test Task')).not.toBeInTheDocument();
    });
  });

  test('does not delete task when cancelled', async () => {
    const mockTask = {
      id: 1,
      title: 'Test Task',
      description: 'Description',
      completed: false,
      created_at: '2024-01-01T00:00:00',
    };

    API.get.mockResolvedValueOnce({ data: [mockTask] });
    global.confirm.mockReturnValueOnce(false);

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    expect(API.delete).not.toHaveBeenCalled();
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  test('shows error when task deletion fails', async () => {
    const mockTask = {
      id: 1,
      title: 'Test Task',
      description: 'Description',
      completed: false,
      created_at: '2024-01-01T00:00:00',
    };

    API.get.mockResolvedValueOnce({ data: [mockTask] });
    API.delete.mockRejectedValueOnce(new Error('Delete failed'));
    global.confirm.mockReturnValueOnce(true);

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.getByText('Failed to delete task')).toBeInTheDocument();
    });
  });

  // ============================================
  // TASK EDITING TESTS
  // ============================================

  test('enters edit mode when edit button is clicked', async () => {
    const mockTask = {
      id: 1,
      title: 'Test Task',
      description: 'Test Description',
      completed: false,
      created_at: '2024-01-01T00:00:00',
    };

    API.get.mockResolvedValueOnce({ data: [mockTask] });

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Edit'));

    // Should show input fields with current values
    const titleInput = screen.getByDisplayValue('Test Task');
    const descriptionInput = screen.getByDisplayValue('Test Description');

    expect(titleInput).toBeInTheDocument();
    expect(descriptionInput).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('saves edited task', async () => {
    const mockTask = {
      id: 1,
      title: 'Original Title',
      description: 'Original Description',
      completed: false,
      created_at: '2024-01-01T00:00:00',
    };

    const updatedTask = {
      ...mockTask,
      title: 'Updated Title',
      description: 'Updated Description',
    };

    API.get.mockResolvedValueOnce({ data: [mockTask] });
    API.put.mockResolvedValueOnce({ data: updatedTask });

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('Original Title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Edit'));

    const titleInput = screen.getByDisplayValue('Original Title');
    const descriptionInput = screen.getByDisplayValue('Original Description');

    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    fireEvent.change(descriptionInput, { target: { value: 'Updated Description' } });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(API.put).toHaveBeenCalledWith('/tasks/1', {
        title: 'Updated Title',
        description: 'Updated Description',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Updated Title')).toBeInTheDocument();
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });
  });

  test('cancels edit mode without saving', async () => {
    const mockTask = {
      id: 1,
      title: 'Original Title',
      description: 'Original Description',
      completed: false,
      created_at: '2024-01-01T00:00:00',
    };

    API.get.mockResolvedValueOnce({ data: [mockTask] });

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('Original Title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Edit'));

    const titleInput = screen.getByDisplayValue('Original Title');
    fireEvent.change(titleInput, { target: { value: 'Changed Title' } });

    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.getByText('Original Title')).toBeInTheDocument();
      expect(screen.queryByText('Changed Title')).not.toBeInTheDocument();
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });

    expect(API.put).not.toHaveBeenCalled();
  });

  test('shows error when task edit fails', async () => {
    const mockTask = {
      id: 1,
      title: 'Test Task',
      description: 'Description',
      completed: false,
      created_at: '2024-01-01T00:00:00',
    };

    API.get.mockResolvedValueOnce({ data: [mockTask] });
    API.put.mockRejectedValueOnce(new Error('Update failed'));

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Edit'));

    const titleInput = screen.getByDisplayValue('Test Task');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Failed to update task')).toBeInTheDocument();
    });
  });

  // ============================================
  // LOGOUT TESTS
  // ============================================

  test('calls onLogout when logout button is clicked', async () => {
    API.get.mockResolvedValueOnce({ data: [] });
    API.post.mockResolvedValueOnce({ data: { message: 'Logged out' } });

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/logout');
      expect(mockOnLogout).toHaveBeenCalled();
    });
  });

  test('calls onLogout even if logout API fails', async () => {
    API.get.mockResolvedValueOnce({ data: [] });
    API.post.mockRejectedValueOnce(new Error('Logout failed'));

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(mockOnLogout).toHaveBeenCalled();
    });
  });

  test('calls onLogout when 401 error occurs on load', async () => {
    API.get.mockRejectedValueOnce({ response: { status: 401 } });

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(mockOnLogout).toHaveBeenCalled();
    });
  });

  // ============================================
  // MULTIPLE TASKS TESTS
  // ============================================

  test('displays multiple tasks correctly', async () => {
    const mockTasks = [
      { id: 1, title: 'Task 1', description: 'Desc 1', completed: false, created_at: '2024-01-01T00:00:00' },
      { id: 2, title: 'Task 2', description: 'Desc 2', completed: true, created_at: '2024-01-02T00:00:00' },
      { id: 3, title: 'Task 3', description: 'Desc 3', completed: false, created_at: '2024-01-03T00:00:00' },
    ];

    API.get.mockResolvedValueOnce({ data: mockTasks });

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
    });
  });

  test('can edit different tasks independently', async () => {
    const mockTasks = [
      { id: 1, title: 'Task 1', description: 'Desc 1', completed: false, created_at: '2024-01-01T00:00:00' },
      { id: 2, title: 'Task 2', description: 'Desc 2', completed: false, created_at: '2024-01-02T00:00:00' },
    ];

    API.get.mockResolvedValueOnce({ data: mockTasks });

    render(<Tasks onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });

    // Get all edit buttons and click the first one
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Only Task 1 should be in edit mode
    expect(screen.getByDisplayValue('Task 1')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Task 2')).not.toBeInTheDocument();
  });
});