// Mock Chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    update: jest.fn(),
    get: jest.fn(),
  },
  runtime: {
    lastError: null,
  },
};
