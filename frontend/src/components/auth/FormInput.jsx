import React from 'react';

function FormInput({ 
  label, 
  type, 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  testId,
  focusColor = "blue"
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${focusColor}-500 focus:border-transparent transition`}
        placeholder={placeholder}
        disabled={disabled}
        data-testid={testId}
      />
    </div>
  );
}

export default FormInput;