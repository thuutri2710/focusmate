import React from "react";
import { BlockingMode } from "../../../types";

interface BlockingModeSelectorProps {
  mode: BlockingMode;
  setMode: (mode: BlockingMode) => void;
}

const BlockingModeSelector: React.FC<BlockingModeSelectorProps> = ({ mode, setMode }) => {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">Blocking mode</label>
      
      <div className="space-y-2">
        <label 
          className={`relative p-2 rounded border flex items-center cursor-pointer ${mode === BlockingMode.BLOCK ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
        >
          <input 
            type="radio" 
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 mr-2" 
            name="blockingMode" 
            checked={mode === BlockingMode.BLOCK}
            onChange={() => setMode(BlockingMode.BLOCK)}
          />
          <div className="flex items-center">
            <span className="text-sm">Always Block</span>
          </div>
        </label>
        
        <label 
          className={`relative p-2 rounded border flex items-center cursor-pointer ${mode === BlockingMode.TIME_LIMIT ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
        >
          <input 
            type="radio" 
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 mr-2" 
            name="blockingMode" 
            checked={mode === BlockingMode.TIME_LIMIT}
            onChange={() => setMode(BlockingMode.TIME_LIMIT)}
          />
          <div className="flex items-center">
            <span className="text-sm">Daily Time Limit</span>
          </div>
        </label>
        
        <label 
          className={`relative p-2 rounded border flex items-center cursor-pointer ${mode === BlockingMode.SCHEDULE ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
        >
          <input 
            type="radio" 
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 mr-2" 
            name="blockingMode" 
            checked={mode === BlockingMode.SCHEDULE}
            onChange={() => setMode(BlockingMode.SCHEDULE)}
          />
          <div className="flex items-center">
            <span className="text-sm">Schedule</span>
          </div>
        </label>
      </div>
    </div>
  );
};

export default BlockingModeSelector;
