import React, { useState, useEffect } from "react";
import { ExtensionSettings } from "../../types";
import { StorageService } from "../../services/storage";
import { isValidTimeFormat } from "../../utils/validation";

const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings>({
    enableNotifications: true,
    darkMode: false,
    resetTime: "00:00",
    defaultBlockMessage: "This website is blocked by FocusMate to help you stay focused.",
  });
  const [error, setError] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);

  // Load settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await StorageService.getSettings();
        setSettings(storedSettings);
      } catch (error) {
        console.error("Error loading settings:", error);
        setError("Failed to load settings");
      }
    };

    loadSettings();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    // Validate reset time
    if (!isValidTimeFormat(settings.resetTime)) {
      setError("Invalid time format. Please use HH:MM format.");
      return;
    }

    try {
      await StorageService.updateSettings(settings);
      setSaved(true);

      // Auto-hide saved message after 3 seconds
      setTimeout(() => {
        setSaved(false);
      }, 3000);

      // Notify background script
      chrome.runtime.sendMessage({ type: "update_settings", payload: { settings } });
    } catch (error) {
      console.error("Error saving settings:", error);
      setError("Failed to save settings");
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    setSettings({
      ...settings,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Settings</h3>

      <form onSubmit={handleSubmit}>
        {/* Notifications Setting */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="enableNotifications"
              checked={settings.enableNotifications}
              onChange={handleChange}
              className="mr-2"
            />
            <span>Enable Notifications</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Receive notifications when websites are blocked
          </p>
        </div>
        {/* Reset Time Setting */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Daily Reset Time</label>
          <input
            type="time"
            name="resetTime"
            value={settings.resetTime}
            onChange={handleChange}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Time when daily statistics are reset</p>
        </div>
        {/* Default Block Message */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Block Message
          </label>
          <textarea
            name="defaultBlockMessage"
            value={settings.defaultBlockMessage}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          ></textarea>
          <p className="text-xs text-gray-500 mt-1">
            Default message shown when a website is blocked
          </p>
        </div>
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {/* Success Message */}
        {saved && (
          <div className="mb-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
            Settings saved successfully
          </div>
        )}
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsTab;
