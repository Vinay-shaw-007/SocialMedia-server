const mongoose = require("mongoose");

const reelsSchema = mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    reels: [
      {
        publicId: String,
        url: String,
        caption: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("reels", reelsSchema);
