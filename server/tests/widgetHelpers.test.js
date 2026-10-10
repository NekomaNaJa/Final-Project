import { jest } from "@jest/globals";
import Donation from "../Models/Donation.js";
import { calculateGoalCurrent } from "../utils/widgetHelpers.js";

describe("widgetHelpers - calculateGoalCurrent", () => {
  const streamerId = "60c72b2f9b1d8b2bad876543";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should calculate total sum when valid startDate and endDate are provided", async () => {
    jest
      .spyOn(Donation, "aggregate")
      .mockResolvedValueOnce([{ _id: null, total: 4500 }]);

    const goal = {
      startDate: "2026-09-01",
      endDate: "2026-09-30",
    };

    const result = await calculateGoalCurrent(streamerId, goal);

    expect(result).toBe(4500);
    expect(Donation.aggregate).toHaveBeenCalledWith([
      {
        $match: expect.objectContaining({
          streamerId,
          status: "approved",
          createdAt: expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date),
          }),
        }),
      },
      {
        $group: { _id: null, total: { $sum: "$amount" } },
      },
    ]);
  });

  it("should ignore invalid date strings gracefully", async () => {
    jest
      .spyOn(Donation, "aggregate")
      .mockResolvedValueOnce([{ _id: null, total: 2000 }]);

    const goal = {
      startDate: "invalid-start-date",
      endDate: "invalid-end-date",
    };

    const result = await calculateGoalCurrent(streamerId, goal);

    expect(result).toBe(2000);
    expect(Donation.aggregate).toHaveBeenCalledWith([
      {
        $match: {
          streamerId,
          status: "approved",
        },
      },
      {
        $group: { _id: null, total: { $sum: "$amount" } },
      },
    ]);
  });

  it("should return 0 when aggregation returns empty array", async () => {
    jest.spyOn(Donation, "aggregate").mockResolvedValueOnce([]);

    const result = await calculateGoalCurrent(streamerId, null);

    expect(result).toBe(0);
  });

  it("should return goal.current as fallback when aggregation throws an error", async () => {
    jest
      .spyOn(Donation, "aggregate")
      .mockRejectedValueOnce(new Error("Database connection lost"));

    const goal = { current: 1500 };

    const result = await calculateGoalCurrent(streamerId, goal);

    expect(result).toBe(1500);
  });

  it("should return 0 when aggregation throws and goal has no current", async () => {
    jest
      .spyOn(Donation, "aggregate")
      .mockRejectedValueOnce(new Error("Database connection lost"));

    const result = await calculateGoalCurrent(streamerId, null);

    expect(result).toBe(0);
  });
});
