import Donation from "../Models/Donation.js";

/**
 * คำนวณยอดสะสมของ Goal จาก Donation Aggregation (เฉพาะสถานะ approved)
 * กรองตามช่วงวันที่ startDate และ endDate ของเป้าหมาย
 *
 * @param {import("mongoose").Types.ObjectId|string} streamerId
 * @param {object} goal
 * @returns {Promise<number>}
 */
export const calculateGoalCurrent = async (streamerId, goal) => {
  try {
    const goalFilter = { streamerId, status: "approved" };

    if (goal?.startDate) {
      const start = new Date(goal.startDate);
      if (!Number.isNaN(start.getTime())) {
        goalFilter.createdAt = { ...goalFilter.createdAt, $gte: start };
      }
    }

    if (goal?.endDate) {
      const end = new Date(goal.endDate);
      if (!Number.isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        goalFilter.createdAt = { ...goalFilter.createdAt, $lte: end };
      }
    }

    const goalAgg = await Donation.aggregate([
      { $match: goalFilter },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return goalAgg[0]?.total || 0;
  } catch {
    return Number(goal?.current) || 0;
  }
};
