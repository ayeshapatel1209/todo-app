import React from 'react';

function TaskItem({ 
  task, 
  isEditing, 
  editData,
  onEdit,
  onSave,
  onCancel,
  onToggle,
  onDelete,
  onEditChange
}) {
  if (isEditing) {
    return (
      <div className={`border rounded-lg p-4 transition ${
        task.completed ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
      }`}>
        <div className="space-y-3">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => onEditChange({ ...editData, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={editData.description || ""}
            onChange={(e) => onEditChange({ ...editData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="2"
          />
          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 transition ${
      task.completed ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={onToggle}
            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${
              task.completed ? "line-through text-gray-500" : "text-gray-800"
            }`}>
              {task.title}
            </h3>
            {task.description && (
              <p className={`mt-1 ${task.completed ? "text-gray-400" : "text-gray-600"}`}>
                {task.description}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Created: {new Date(task.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskItem;