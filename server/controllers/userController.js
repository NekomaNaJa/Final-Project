import User from "../Models/User.js";

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "ไม่พบผู้ใช้",
        data: null,
      });
    }

    res.json({
      message: "ดึงข้อมูลผู้ใช้สำเร็จ",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};
