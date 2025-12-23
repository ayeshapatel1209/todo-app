import React from 'react';

function AddTaskForm({ 
  title, 
  description, 
  onTitleChange, 
  onDescriptionChange, 
  onSubmit, 
  error 
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Task</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={title}
            onChange={onTitleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Task title"
          />
        </div>
        <div>
          <textarea
            value={description}
            onChange={onDescriptionChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
            placeholder="Task description (optional)"
            rows="3"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Add Task
        </button>
      </form>
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}

export default AddTaskForm;