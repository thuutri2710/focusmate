import React from "react";

interface FormButtonsProps {
  onCancel?: () => void;
  isEditMode: boolean;
}

const FormButtons: React.FC<FormButtonsProps> = ({ onCancel, isEditMode }) => {
  return (
    <div className="flex justify-end space-x-2 mt-4">
      {onCancel && (
        <button
          type="button"
          className="px-3 py-1 border text-sm text-gray-700 bg-white hover:bg-gray-50 rounded"
          onClick={onCancel}
        >
          Cancel
        </button>
      )}
      <button
        type="submit"
        className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded"
      >
        {isEditMode ? "Update" : "Save"}
      </button>
    </div>
  );
};

export default FormButtons;
