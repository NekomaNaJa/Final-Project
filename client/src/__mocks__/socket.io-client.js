const listeners = new Map();

function addListener(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, []);
  }
  listeners.get(event).push(callback);
  return mockSocketInstance;
}

function removeListener(event, callback) {
  if (!listeners.has(event)) return mockSocketInstance;
  if (callback) {
    const filtered = listeners.get(event).filter((cb) => cb !== callback);
    listeners.set(event, filtered);
  } else {
    listeners.delete(event);
  }
  return mockSocketInstance;
}

export const mockSocketInstance = {
  id: "mock-socket-id",
  connected: true,
  on: jest.fn(addListener),
  off: jest.fn(removeListener),
  emit: jest.fn(() => mockSocketInstance),
  disconnect: jest.fn(() => {
    mockSocketInstance.connected = false;
    return mockSocketInstance;
  }),
  connect: jest.fn(() => {
    mockSocketInstance.connected = true;
    return mockSocketInstance;
  }),
  __trigger: (event, data) => {
    const list = listeners.get(event) || [];
    list.forEach((cb) => cb(data));
  },
  __clearListeners: () => {
    listeners.clear();
  },
  __reset: () => {
    listeners.clear();
    mockSocketInstance.on.mockImplementation(addListener);
    mockSocketInstance.off.mockImplementation(removeListener);
    mockSocketInstance.emit.mockReturnValue(mockSocketInstance);
  },
};

function createMockSocket() {
  return mockSocketInstance;
}

export const io = createMockSocket;
export default createMockSocket;
