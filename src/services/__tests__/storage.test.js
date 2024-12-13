import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { StorageService } from "../storage.js";

// Mock chrome.storage.local
const mockStorage = {
  data: {},
  get: jest.fn((key) => Promise.resolve({ [key]: mockStorage.data[key] })),
  set: jest.fn((data) => {
    Object.assign(mockStorage.data, data);
    return Promise.resolve();
  }),
};

// Setup global chrome mock
global.chrome = {
  storage: {
    local: mockStorage,
  },
};

describe("StorageService", () => {
  beforeEach(() => {
    // Clear all mocks and reset data before each test
    jest.clearAllMocks();
    mockStorage.data = {};
  });

  describe("getRules", () => {
    it("should return empty array when no rules exist", async () => {
      mockStorage.data.blockRules = undefined;
      const rules = await StorageService.getRules();
      expect(rules).toEqual([]);
      expect(mockStorage.get).toHaveBeenCalledWith("blockRules");
    });

    it("should return cached rules within cache duration", async () => {
      const testRules = [{ id: "1", websiteUrl: "test.com" }];
      mockStorage.data.blockRules = testRules;

      // First call should hit storage
      const rules1 = await StorageService.getRules();
      expect(rules1).toEqual(testRules);
      expect(mockStorage.get).toHaveBeenCalledTimes(1);

      // Second call within cache duration should use cache
      const rules2 = await StorageService.getRules();
      expect(rules2).toEqual(testRules);
      expect(mockStorage.get).toHaveBeenCalledTimes(1);
    });
  });

  describe("saveRule", () => {
    it("should save new rule with generated id", async () => {
      const newRule = { websiteUrl: "test.com", dailyTimeLimit: 60 };
      await StorageService.saveRule(newRule);

      expect(mockStorage.set).toHaveBeenCalled();
      const savedRules = mockStorage.data.blockRules;
      expect(savedRules).toHaveLength(1);
      expect(savedRules[0].websiteUrl).toBe("test.com");
      expect(savedRules[0].id).toBeDefined();
    });

    it("should trim whitespace from website URL", async () => {
      const newRule = { websiteUrl: "  test.com  ", dailyTimeLimit: 60 };
      await StorageService.saveRule(newRule);

      const savedRules = mockStorage.data.blockRules;
      expect(savedRules[0].websiteUrl).toBe("test.com");
    });
  });

  describe("deleteRule", () => {
    it("should delete existing rule", async () => {
      const rule = { id: "123", websiteUrl: "test.com" };
      mockStorage.data.blockRules = [rule];

      await StorageService.deleteRule("123");

      expect(mockStorage.set).toHaveBeenCalledWith({
        blockRules: [],
      });
    });
  });

  describe("cleanupOldTimeUsage", () => {
    it("should only keep today's data", async () => {
      const today = new Date().toLocaleDateString();
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

      mockStorage.data.timeUsage = {
        [today]: { "https://test.com": 30 },
        [yesterday]: { "https://test.com": 60 },
      };

      await StorageService.cleanupOldTimeUsage();

      expect(mockStorage.set).toHaveBeenCalledWith({
        timeUsage: {
          [today]: { "https://test.com": 30 },
        },
      });
    });
  });

  describe("updateTimeUsage", () => {
    it("should handle URLs without protocol", async () => {
      const url = "test.com";
      const minutes = 30;
      const today = new Date().toLocaleDateString();

      await StorageService.updateTimeUsage(url, minutes);

      expect(mockStorage.set).toHaveBeenCalledWith({
        timeUsage: {
          [today]: {
            "https://test.com": minutes,
          },
        },
      });
    });

    it("should accumulate time usage", async () => {
      const url = "https://test.com";
      const today = new Date().toLocaleDateString();

      mockStorage.data.timeUsage = {
        [today]: { [url]: 30 },
      };

      await StorageService.updateTimeUsage(url, 15);

      expect(mockStorage.set).toHaveBeenCalledWith({
        timeUsage: {
          [today]: {
            [url]: 45,
          },
        },
      });
    });
  });

  describe("isUrlBlocked", () => {
    beforeEach(() => {
      StorageService.rulesCache = null;
      StorageService.rulesCacheTimestamp = 0;
    });

    it("should block URL when daily time limit is exceeded (with protocol)", async () => {
      const today = new Date().toLocaleDateString();
      const url = "https://test.com";

      mockStorage.data.blockRules = [
        {
          id: "1",
          websiteUrl: "https://test.com",
          dailyTimeLimit: 30,
        },
      ];

      mockStorage.data.timeUsage = {
        [today]: { [url]: 35 },
      };

      const result = await StorageService.isUrlBlocked(url);
      expect(result).toBeTruthy();
      expect(result.id).toBe("1");
    });

    it("should block URL when daily time limit is exceeded (without protocol)", async () => {
      const today = new Date().toLocaleDateString();
      const url = "test.com";
      const normalizedUrl = "https://test.com";

      mockStorage.data.blockRules = [
        {
          id: "1",
          websiteUrl: "test.com",
          dailyTimeLimit: 30,
        },
      ];

      mockStorage.data.timeUsage = {
        [today]: { [normalizedUrl]: 35 },
      };

      const result = await StorageService.isUrlBlocked(url);
      expect(result).toBeTruthy();
      expect(result.id).toBe("1");
    });

    it("should handle wildcard rules with asterisk", async () => {
      const url = "https://subdomain.test.com/path";

      mockStorage.data.blockRules = [
        {
          id: "1",
          websiteUrl: "*.test.com/*",
          dailyTimeLimit: 30,
        },
      ];

      mockStorage.data.timeUsage = {
        [new Date().toLocaleDateString()]: {
          [url]: 35,
        },
      };

      const result = await StorageService.isUrlBlocked(url);
      expect(result).toBeTruthy();
      expect(result.id).toBe("1");
    });

    it("should handle wildcard rules with question mark", async () => {
      const url = "https://a.test.com";

      mockStorage.data.blockRules = [
        {
          id: "1",
          websiteUrl: "?.test.com",
          dailyTimeLimit: 30,
        },
      ];

      mockStorage.data.timeUsage = {
        [new Date().toLocaleDateString()]: {
          [url]: 35,
        },
      };

      const result = await StorageService.isUrlBlocked(url);
      expect(result).toBeTruthy();
      expect(result.id).toBe("1");
    });

    it("should handle regular expression rules", async () => {
      const url = "https://test123.example.com";

      mockStorage.data.blockRules = [
        {
          id: "1",
          websiteUrl: "/test\\d+\\.example\\.com/",
          dailyTimeLimit: 30,
        },
      ];

      mockStorage.data.timeUsage = {
        [new Date().toLocaleDateString()]: {
          [url]: 35,
        },
      };

      const result = await StorageService.isUrlBlocked(url);
      expect(result).toBeTruthy();
      expect(result.id).toBe("1");
    });

    it("should handle case-insensitive matching", async () => {
      const url = "https://TEST.com/PATH";

      mockStorage.data.blockRules = [
        {
          id: "1",
          websiteUrl: "test.com/path",
          dailyTimeLimit: 30,
        },
      ];

      mockStorage.data.timeUsage = {
        [new Date().toLocaleDateString()]: {
          [url.toLowerCase()]: 35,
        },
      };

      const result = await StorageService.isUrlBlocked(url);
      expect(result).toBeTruthy();
      expect(result.id).toBe("1");
    });

    it("should return null when no rules match", async () => {
      const url = "https://allowed.com";

      mockStorage.data.blockRules = [
        {
          id: "1",
          websiteUrl: "blocked.com",
          dailyTimeLimit: 30,
        },
      ];

      const result = await StorageService.isUrlBlocked(url);
      expect(result).toBeNull();
    });

    it("should handle invalid regular expressions gracefully", async () => {
      const url = "https://test.com";

      mockStorage.data.blockRules = [
        {
          id: "1",
          websiteUrl: "/[invalid/", // Invalid regex
          dailyTimeLimit: 30,
        },
      ];

      const result = await StorageService.isUrlBlocked(url);
      expect(result).toBeNull();
    });
  });
});
