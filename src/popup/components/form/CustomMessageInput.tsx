import React from "react";

interface CustomMessageInputProps {
  customMessage: string;
  setCustomMessage: (message: string) => void;
}

const CustomMessageInput: React.FC<CustomMessageInputProps> = ({ 
  customMessage, 
  setCustomMessage 
}) => {
  return (
    <div className="mb-3">
      <label htmlFor="custom-message-input" className="block text-sm font-medium text-gray-700 mb-1">
        Custom block message (optional)
      </label>
      <textarea
        id="custom-message-input"
        className="w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Example: 'Focus on your work!'"
        value={customMessage}
        onChange={(e) => setCustomMessage(e.target.value)}
        rows={2}
      ></textarea>
    </div>
  );
};

export default CustomMessageInput;
