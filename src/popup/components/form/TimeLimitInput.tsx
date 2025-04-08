import React from "react";

interface TimeLimitInputProps {
  timeLimit: { hours: number; minutes: number };
  setTimeLimit: (timeLimit: { hours: number; minutes: number }) => void;
}

const TimeLimitInput: React.FC<TimeLimitInputProps> = ({ timeLimit, setTimeLimit }) => {
  return (
    <div className="mb-3 pl-4 border-l-2 border-blue-200">
      <label className="block text-sm font-medium text-gray-700 mb-2">Daily time limit</label>
      
      <div className="flex space-x-3">
        <div className="w-24">
          <input
            id="hours-input"
            type="number"
            className="w-full px-2 py-1 text-sm border rounded"
            min="0"
            max="23"
            value={timeLimit.hours}
            onChange={(e) => {
              const value = e.target.value === '' ? 0 : parseInt(e.target.value);
              const hours = Math.min(Math.max(0, value), 23);
              setTimeLimit({ ...timeLimit, hours });
            }}
          />
          <label htmlFor="hours-input" className="text-xs text-gray-500">Hours</label>
        </div>
        
        <div className="w-24">
          <input
            id="minutes-input"
            type="number"
            className="w-full px-2 py-1 text-sm border rounded"
            min="0"
            max="59"
            value={timeLimit.minutes}
            onChange={(e) => {
              const value = e.target.value === '' ? 0 : parseInt(e.target.value);
              const minutes = Math.min(Math.max(0, value), 59);
              setTimeLimit({ ...timeLimit, minutes });
            }}
          />
          <label htmlFor="minutes-input" className="text-xs text-gray-500">Minutes</label>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        After this time is used up each day, the site will be blocked
      </div>
    </div>
  );
};

export default TimeLimitInput;
