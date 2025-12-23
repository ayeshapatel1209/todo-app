import React from 'react';

function AuthLayout({ children, title, subtitle, gradientFrom, gradientTo }) {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${gradientFrom} ${gradientTo}`}>
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
          <p className="text-gray-600">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;