import React from "react";

interface ErrorMessageProps {
  error: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
      {error}
    </div>
  );
};

export default ErrorMessage;
