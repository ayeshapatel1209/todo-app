import React from 'react';

function TasksHeader({ totalTasks, pendingTasks, onLogout }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Tasks</h1>
          <p className="text-gray-600 mt-1">
            {totalTasks} {totalTasks === 1 ? "task" : "tasks"} total,{" "}
            {pendingTasks} pending
          </p>
        </div>
        <button
          onClick={onLogout}
          className="px-6 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default TasksHeader;