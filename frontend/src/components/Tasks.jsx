
import { useState, useEffect } from "react";
import API from "../api";
import TasksHeader from "./tasks/TasksHeader";
import AddTaskForm from "./tasks/AddTaskForm";
import TaskItem from "./tasks/TaskItem";

function Tasks({ onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingTask, setEditingTask] = useState(null);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await API.get("/tasks");
      setTasks(response.data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        onLogout();
      } else {
        setError("Failed to load tasks");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      setError("");
      const response = await API.post("/tasks", {
        title: newTaskTitle,
        description: newTaskDescription || null,
      });
      setTasks([...tasks, response.data]);
      setNewTaskTitle("");
      setNewTaskDescription("");
    } catch (err) {
      setError("Failed to add task");
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const response = await API.put(`/tasks/${task.id}`, {
        completed: !task.completed,
      });
      setTasks(tasks.map((t) => (t.id === task.id ? response.data : t)));
    } catch (err) {
      setError("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      await API.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err) {
      setError("Failed to delete task");
    }
  };

  const handleStartEdit = (task) => {
    setEditingTask({ ...task });
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await API.put(`/tasks/${editingTask.id}`, {
        title: editingTask.title,
        description: editingTask.description,
      });
      setTasks(tasks.map((t) => (t.id === editingTask.id ? response.data : t)));
      setEditingTask(null);
    } catch (err) {
      setError("Failed to update task");
    }
  };

  const handleLogout = async () => {
    try {
      await API.post("/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      onLogout();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <TasksHeader 
          totalTasks={tasks.length}
          pendingTasks={tasks.filter((t) => !t.completed).length}
          onLogout={handleLogout}
        />

        <AddTaskForm
          title={newTaskTitle}
          description={newTaskDescription}
          onTitleChange={(e) => setNewTaskTitle(e.target.value)}
          onDescriptionChange={(e) => setNewTaskDescription(e.target.value)}
          onSubmit={handleAddTask}
          error={error}
        />

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Task List
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tasks yet. Create your first task above!
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isEditing={editingTask && editingTask.id === task.id}
                  editData={editingTask}
                  onEdit={() => handleStartEdit(task)}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                  onToggle={() => handleToggleComplete(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                  onEditChange={setEditingTask}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Tasks;