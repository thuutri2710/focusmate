import React, { useState, useEffect } from "react";
import { BlockRule, BlockingMode, DayOfWeek, TimeRange, RuleFormProps } from "../../types";
import { validateRule } from "../../utils/validation";
import {
  DomainInput,
  BlockingModeSelector,
  TimeLimitInput,
  ScheduleInput,
  CustomMessageInput,
  FormButtons,
  ErrorMessage
} from "./form";

const AddRuleTab: React.FC<RuleFormProps> = ({ initialRule, onSubmit, onCancel }) => {
  const [domain, setDomain] = useState<string>("");
  const [mode, setMode] = useState<BlockingMode>(BlockingMode.BLOCK);
  const [timeLimit, setTimeLimit] = useState<{ hours: number; minutes: number }>({
    hours: 0,
    minutes: 30,
  });
  const [schedule, setSchedule] = useState<{ days: DayOfWeek[]; timeRanges: TimeRange[] }>({
    days: [],
    timeRanges: [{ start: "09:00", end: "17:00" }],
  });
  const [customMessage, setCustomMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Initialize form with initial rule if provided
  useEffect(() => {
    if (initialRule) {
      setDomain(initialRule.domain || "");
      setMode(initialRule.mode || BlockingMode.BLOCK);

      if (initialRule.timeLimit) {
        const hours = Math.floor(initialRule.timeLimit / (1000 * 60 * 60));
        const minutes = Math.floor((initialRule.timeLimit % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLimit({ hours, minutes });
      }

      if (initialRule.schedule) {
        setSchedule(initialRule.schedule);
      }

      setCustomMessage(initialRule.customMessage || "");
    }
  }, [initialRule]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create rule object
    const rule: Omit<BlockRule, "id" | "createdAt" | "updatedAt"> = {
      domain,
      mode,
      active: initialRule?.active ?? true,
    };

    // Add mode-specific properties
    if (mode === BlockingMode.TIME_LIMIT) {
      rule.timeLimit = timeLimit.hours * 60 * 60 * 1000 + timeLimit.minutes * 60 * 1000;
    } else if (mode === BlockingMode.SCHEDULE) {
      rule.schedule = schedule;
    }

    // Add custom message if provided
    if (customMessage.trim()) {
      rule.customMessage = customMessage;
    }

    // Validate rule
    const validation = validateRule(rule);
    if (!validation.isValid) {
      setError(validation.error || "Invalid rule");
      return;
    }

    // Submit rule
    onSubmit(rule);

    // Reset form
    if (!initialRule) {
      resetForm();
    }
  };

  // Reset form to default values
  const resetForm = () => {
    setDomain("");
    setMode(BlockingMode.BLOCK);
    setTimeLimit({ hours: 0, minutes: 30 });
    setSchedule({
      days: [],
      timeRanges: [{ start: "09:00", end: "17:00" }],
    });
    setCustomMessage("");
    setError("");
  };

  // Handle adding a new time range
  const handleAddTimeRange = () => {
    setSchedule({
      ...schedule,
      timeRanges: [...schedule.timeRanges, { start: "09:00", end: "17:00" }],
    });
  };

  // Handle removing a time range
  const handleRemoveTimeRange = (index: number) => {
    const newTimeRanges = [...schedule.timeRanges];
    newTimeRanges.splice(index, 1);
    setSchedule({
      ...schedule,
      timeRanges: newTimeRanges,
    });
  };

  // Handle updating a time range
  const handleTimeRangeChange = (index: number, field: "start" | "end", value: string) => {
    const newTimeRanges = [...schedule.timeRanges];
    newTimeRanges[index] = {
      ...newTimeRanges[index],
      [field]: value,
    };

    setSchedule({
      ...schedule,
      timeRanges: newTimeRanges,
    });
  };

  // Handle toggling a day in the schedule
  const handleDayToggle = (day: DayOfWeek) => {
    const newDays = schedule.days.includes(day)
      ? schedule.days.filter((d) => d !== day)
      : [...schedule.days, day];

    setSchedule({
      ...schedule,
      days: newDays,
    });
  };

  return (
    <div className="max-w-xl mx-auto p-3 bg-white">
      <h2 className="text-base font-medium mb-2">
        {!!initialRule ? 'Edit Rule' : 'Add Rule'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Domain Input */}
        <DomainInput domain={domain} setDomain={setDomain} />

        {/* Blocking Mode Select */}
        <BlockingModeSelector mode={mode} setMode={setMode} />

        {/* Time Limit Container */}
        {mode === BlockingMode.TIME_LIMIT && (
          <TimeLimitInput timeLimit={timeLimit} setTimeLimit={setTimeLimit} />
        )}

        {/* Schedule Container */}
        {mode === BlockingMode.SCHEDULE && (
          <ScheduleInput
            schedule={schedule}
            onDayToggle={handleDayToggle}
            onAddTimeRange={handleAddTimeRange}
            onRemoveTimeRange={handleRemoveTimeRange}
            onTimeRangeChange={handleTimeRangeChange}
          />
        )}

        {/* Custom Message Input */}
        <CustomMessageInput customMessage={customMessage} setCustomMessage={setCustomMessage} />

        {/* Error Message */}
        <ErrorMessage error={error} />

        {/* Form Buttons */}
        <FormButtons onCancel={onCancel} isEditMode={!!initialRule} />
      </form>
    </div>
  );
};

export default AddRuleTab;
