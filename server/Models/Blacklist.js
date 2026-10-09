import mongoose from "mongoose";

const blacklistSchema = new mongoose.Schema(
  {
    streamerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    word: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    reason: {
      type: String,
      default: "",
      maxlength: 200,
    },
  },
  { timestamps: true }
);

blacklistSchema.index({ streamerId: 1, word: 1 }, { unique: true });

const Blacklist = mongoose.model("Blacklist", blacklistSchema);

export default Blacklist;
