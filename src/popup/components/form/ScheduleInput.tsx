import React from "react";
import { DayOfWeek, TimeRange } from "../../../types";
import { DAYS_LIST, DAY_LABELS } from "../../../constants";

interface ScheduleInputProps {
  schedule: { days: DayOfWeek[]; timeRanges: TimeRange[] };
  onDayToggle: (day: DayOfWeek) => void;
  onAddTimeRange: () => void;
  onRemoveTimeRange: (index: number) => void;
  onTimeRangeChange: (index: number, field: "start" | "end", value: string) => void;
}

const ScheduleInput: React.FC<ScheduleInputProps> = ({
  schedule,
  onDayToggle,
  onAddTimeRange,
  onRemoveTimeRange,
  onTimeRangeChange,
}) => {
  return (
    <div className="mb-3 pl-4 border-l-2 border-blue-200">
      {/* Days Selection */}
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Block on days:</label>
        <div className="flex flex-wrap gap-1">
          {DAYS_LIST.map((day) => (
            <button
              key={day}
              type="button"
              className={`px-2 py-1 text-xs rounded ${schedule.days.includes(day) ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 border border-gray-200"}`}
              onClick={() => onDayToggle(day)}
            >
              {DAY_LABELS[day]}
            </button>
          ))}
        </div>
      </div>

      {/* Time Ranges */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">During times:</label>
        <div className="space-y-2">
          {schedule.timeRanges.map((timeRange, index) => (
            <div key={index} className="flex items-center">
              <div className="flex items-center">
                <input
                  id={`start-time-${index}`}
                  type="time"
                  className="border rounded text-sm px-1 py-0.5 w-24"
                  value={timeRange.start}
                  onChange={(e) => onTimeRangeChange(index, "start", e.target.value)}
                  required
                />
                <span className="mx-1 text-xs text-gray-500">to</span>
                <input
                  id={`end-time-${index}`}
                  type="time"
                  className="border rounded text-sm px-1 py-0.5 w-24"
                  value={timeRange.end}
                  onChange={(e) => onTimeRangeChange(index, "end", e.target.value)}
                  required
                />
              </div>
              <button
                type="button"
                className="ml-1 text-gray-400 hover:text-red-500 p-1"
                onClick={() => onRemoveTimeRange(index)}
                disabled={schedule.timeRanges.length === 1}
                aria-label="Remove time range"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center"
          onClick={onAddTimeRange}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add time range
        </button>
      </div>
    </div>
  );
};

export default ScheduleInput;
