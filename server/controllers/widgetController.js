import mongoose from "mongoose";
import crypto from "crypto";
import Widget from "../Models/Widget.js";
import { calculateGoalCurrent } from "../utils/widgetHelpers.js";

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

    widgetData.goal = {
      ...widgetData.goal,
      current: await calculateGoalCurrent(safeUserId, widgetData.goal),
    };

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
      const prevAlert = typeof widget.alert?.toObject === "function" ? widget.alert.toObject() : widget.alert;
      widget.alert = { ...prevAlert, ...alert };
    }

    if (goal && typeof goal === "object" && !Array.isArray(goal)) {
      const { current: _ignoreCurrent, ...goalFields } = goal;
      const prevGoal = typeof widget.goal?.toObject === "function" ? widget.goal.toObject() : widget.goal;
      widget.goal = { ...prevGoal, ...goalFields };
    }

    if (leaderboard && typeof leaderboard === "object" && !Array.isArray(leaderboard)) {
      const prevLb = typeof widget.leaderboard?.toObject === "function" ? widget.leaderboard.toObject() : widget.leaderboard;
      widget.leaderboard = { ...prevLb, ...leaderboard };
    }

    if (mission && typeof mission === "object" && !Array.isArray(mission)) {
      const prevMission = typeof widget.mission?.toObject === "function" ? widget.mission.toObject() : widget.mission;
      widget.mission = { ...prevMission, ...mission };
    }

    if (regenerateToken === true) {
      widget.token = crypto.randomUUID();
    }

    await widget.save();

    const widgetData =
      typeof widget.toObject === "function" ? widget.toObject() : { ...widget };

    widgetData.goal = {
      ...widgetData.goal,
      current: await calculateGoalCurrent(safeUserId, widgetData.goal),
    };

    if (req.io && widget.token) {
      const configPayload = {
        token: widget.token,
        streamerId: safeUserId,
        username: req.user?.username,
        alert: widget.alert,
        goal: widgetData.goal,
        leaderboard: widgetData.leaderboard,
        mission: widgetData.mission,
      };

      const targets = new Set(
        [
          widget.token,
          safeUserId ? String(safeUserId) : null,
          req.user?.username ? String(req.user.username) : null,
        ].filter(Boolean)
      );

      for (const target of targets) {
        req.io.to(target).emit("widget-config-updated", configPayload);
        if (!target.startsWith("streamer_")) {
          req.io.to(`streamer_${target}`).emit("widget-config-updated", configPayload);
        }
      }
    }

    return res.status(200).json({
      message: "บันทึกการตั้งค่าวิดเจ็ตสำเร็จ",
      data: widgetData,
    });
  } catch (err) {
    next(err);
  }
};
