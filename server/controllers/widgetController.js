import mongoose from "mongoose";
import crypto from "crypto";
import Widget from "../Models/Widget.js";
import Donation from "../Models/Donation.js";

/**
 * ดึงข้อมูลการตั้งค่าวิดเจ็ตของผู้ใช้ปัจจุบัน (GET /api/widgets/me)
 * หากยังไม่มีข้อมูลใน DB จะสร้างค่าเริ่มต้นให้อัตโนมัติ
 * และคำนวณยอด goal.current จากยอดบริจาคจริง (เฉพาะสถานะ approved)
 */
export const getMyWidget = async (req, res, next) => {
  try {
    const rawUserId = req.user?.userId;
    if (!rawUserId || !mongoose.isValidObjectId(rawUserId)) {
      return res.status(401).json({
        message: "ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ",
        data: null,
      });
    }

    const safeUserId = new mongoose.Types.ObjectId(String(rawUserId));
    let widget = await Widget.findOne({ userId: { $eq: safeUserId } });

    if (!widget) {
      widget = new Widget({ userId: safeUserId });
      await widget.save();
    }

    const widgetData =
      typeof widget.toObject === "function" ? widget.toObject() : { ...widget };

    // คำนวณยอดสะสมของ Goal จาก Donation Aggregation (เฉพาะสถานะ approved)
    try {
      const goalFilter = { streamerId: safeUserId, status: "approved" };
      if (widgetData.goal?.startDate) {
        const start = new Date(widgetData.goal.startDate);
        if (!Number.isNaN(start.getTime())) {
          goalFilter.createdAt = { ...goalFilter.createdAt, $gte: start };
        }
      }
      if (widgetData.goal?.endDate) {
        const end = new Date(widgetData.goal.endDate);
        if (!Number.isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          goalFilter.createdAt = { ...goalFilter.createdAt, $lte: end };
        }
      }

      const goalAgg = await Donation.aggregate([
        { $match: goalFilter },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      const goalCurrent = goalAgg[0]?.total || 0;
      widgetData.goal = {
        ...widgetData.goal,
        current: goalCurrent,
      };
    } catch {
      // หาก aggregation ไม่พร้อม ให้ใช้ค่าเดิมของ goal
    }

    return res.status(200).json({
      message: "ดึงข้อมูลการตั้งค่าวิดเจ็ตสำเร็จ",
      data: widgetData,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * บันทึก/อัปเดตการตั้งค่าวิดเจ็ตของผู้ใช้ปัจจุบัน (PUT /api/widgets/me)
 * รองรับการอัปเดต alert, goal, leaderboard, mission และสร้าง token ใหม่
 */
export const updateMyWidget = async (req, res, next) => {
  try {
    const rawUserId = req.user?.userId;
    if (!rawUserId || !mongoose.isValidObjectId(rawUserId)) {
      return res.status(401).json({
        message: "ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ",
        data: null,
      });
    }

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        message: "ข้อมูลที่ส่งมาไม่ถูกต้อง",
        data: null,
      });
    }

    const safeUserId = new mongoose.Types.ObjectId(String(rawUserId));
    let widget = await Widget.findOne({ userId: { $eq: safeUserId } });

    if (!widget) {
      widget = new Widget({ userId: safeUserId });
    }

    const { alert, goal, leaderboard, mission, regenerateToken } = req.body;

    if (alert && typeof alert === "object" && !Array.isArray(alert)) {
      widget.alert = { ...widget.alert.toObject(), ...alert };
    }

    if (goal && typeof goal === "object" && !Array.isArray(goal)) {
      const { current: _ignoreCurrent, ...goalFields } = goal;
      widget.goal = { ...widget.goal.toObject(), ...goalFields };
    }

    if (leaderboard && typeof leaderboard === "object" && !Array.isArray(leaderboard)) {
      widget.leaderboard = { ...widget.leaderboard.toObject(), ...leaderboard };
    }

    if (mission && typeof mission === "object" && !Array.isArray(mission)) {
      widget.mission = { ...widget.mission.toObject(), ...mission };
    }

    if (regenerateToken === true) {
      widget.token = crypto.randomUUID();
    }

    await widget.save();

    const widgetData =
      typeof widget.toObject === "function" ? widget.toObject() : { ...widget };

    try {
      const goalFilter = { streamerId: safeUserId, status: "approved" };
      if (widgetData.goal?.startDate) {
        const start = new Date(widgetData.goal.startDate);
        if (!Number.isNaN(start.getTime())) {
          goalFilter.createdAt = { ...goalFilter.createdAt, $gte: start };
        }
      }
      if (widgetData.goal?.endDate) {
        const end = new Date(widgetData.goal.endDate);
        if (!Number.isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          goalFilter.createdAt = { ...goalFilter.createdAt, $lte: end };
        }
      }

      const goalAgg = await Donation.aggregate([
        { $match: goalFilter },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      const goalCurrent = goalAgg[0]?.total || 0;
      widgetData.goal = {
        ...widgetData.goal,
        current: goalCurrent,
      };
    } catch {
      // หาก aggregation ไม่พร้อม ให้ใช้ค่าเดิมของ goal
    }

    return res.status(200).json({
      message: "บันทึกการตั้งค่าวิดเจ็ตสำเร็จ",
      data: widgetData,
    });
  } catch (err) {
    next(err);
  }
};
