jest.mock("socket.io-client", () => {
  const instance = {
    id: "mock-socket-id",
    connected: true,
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
  };
  function createMockSocket() {
    return instance;
  }
  return {
    __esModule: true,
    io: createMockSocket,
    default: createMockSocket,
  };
});

import {
  SOCKET_URL,
  getSocket,
  disconnectSocket,
  joinStreamRoom,
  leaveStreamRoom,
  emitTestAlert,
  emitWidgetConfigUpdate,
} from "./socket";

describe("Socket Utility (client/src/utils/socket.js)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    disconnectSocket();
  });

  test("SOCKET_URL is defined with correct fallback or origin", () => {
    expect(SOCKET_URL).toBeDefined();
    expect(typeof SOCKET_URL).toBe("string");
    expect(SOCKET_URL).not.toMatch(/\/api\/?$/);
  });

  test("getSocket initializes and returns singleton socket instance", () => {
    const s1 = getSocket();
    const s2 = getSocket();
    expect(s1).toBe(s2);
    expect(s1.on).toBeDefined();
    expect(s1.emit).toBeDefined();
  });

  test("disconnectSocket calls socket.disconnect and resets instance", () => {
    const s1 = getSocket();
    disconnectSocket();
    expect(s1.disconnect).toHaveBeenCalled();

    const s2 = getSocket();
    expect(s2).toBeDefined();
  });

  test("joinStreamRoom emits join-stream with room name and streamer_ prefix", () => {
    const s = getSocket();
    joinStreamRoom("gamer_boy");
    expect(s.emit).toHaveBeenCalledWith("join-stream", "gamer_boy");
    expect(s.emit).toHaveBeenCalledWith("join-stream", "streamer_gamer_boy");
  });

  test("joinStreamRoom handles room already prefixed with streamer_", () => {
    const s = getSocket();
    joinStreamRoom("streamer_123");
    expect(s.emit).toHaveBeenCalledWith("join-stream", "streamer_123");
    // Should not re-prefix
    expect(s.emit).not.toHaveBeenCalledWith("join-stream", "streamer_streamer_123");
  });

  test("joinStreamRoom does nothing if room is empty or falsy", () => {
    const s = getSocket();
    s.emit.mockClear();
    joinStreamRoom("");
    joinStreamRoom(null);
    expect(s.emit).not.toHaveBeenCalled();
  });

  test("leaveStreamRoom emits leave-stream correctly", () => {
    const s = getSocket();
    leaveStreamRoom("gamer_boy");
    expect(s.emit).toHaveBeenCalledWith("leave-stream", "gamer_boy");
    expect(s.emit).toHaveBeenCalledWith("leave-stream", "streamer_gamer_boy");
  });

  test("leaveStreamRoom handles already prefixed room and ignores falsy", () => {
    const s = getSocket();
    leaveStreamRoom("streamer_456");
    expect(s.emit).toHaveBeenCalledWith("leave-stream", "streamer_456");
    expect(s.emit).not.toHaveBeenCalledWith("leave-stream", "streamer_streamer_456");

    s.emit.mockClear();
    leaveStreamRoom("");
    expect(s.emit).not.toHaveBeenCalled();
  });

  test("emitTestAlert emits test-alert event with payload", () => {
    const s = getSocket();
    const payload = { username: "pro_gamer", amount: 200 };
    emitTestAlert(payload);
    expect(s.emit).toHaveBeenCalledWith("test-alert", payload);
  });

  test("emitWidgetConfigUpdate emits widget-config-update event with payload", () => {
    const s = getSocket();
    const payload = { token: "tok_123", streamerId: "u_456", alert: {} };
    emitWidgetConfigUpdate(payload);
    expect(s.emit).toHaveBeenCalledWith("widget-config-update", payload);
  });
});
