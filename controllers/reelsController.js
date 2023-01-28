const User = require("../models/User");
const Reels = require("../models/Reels");
const { success, error } = require("../utils/responseWrapper");
const cloudinary = require("cloudinary").v2;

const createReelController = async (req, res) => {
  try {
    const { caption, postReel } = req.body;
    const owner = req._id;

    console.log("post reel", postReel);
    console.log("caption", caption);

    if (!caption || !postReel) {
      return res.send(error(400, "Caption and Reel are required"));
    }

    if (!caption) {
      return res.send(error(400, "Caption is required"));
    }

    if (!postReel) {
      return res.send(error(400, "Reel is required"));
    }

    const user = await User.findById(owner);
    const userReelId = user.reelId;

    const reelAlreadyPresent = await Reels.findById(userReelId);

    const cloudImg = await cloudinary.uploader.upload(postReel, {
      folder: "reels",
      resource_type: "video",
    });

    const reelData = {
      publicId: cloudImg.public_id,
      url: cloudImg.url,
      caption,
    };
    if (!reelAlreadyPresent) {
      //if user is creating reels for the first time....
      console.log("Create reels for the first time", userReelId);
      const reel = await Reels.create({
        owner: req._id,
        caption,
        reels: reelData,
      });

      user.reelId = reel._id;
      await user.save();
    } else {
      // if user already created his/her reels and want to create more....
      reelAlreadyPresent.reels.push(reelData);
      await reelAlreadyPresent.save();
    }

    return res.send(success(200, "Reached to the reels router"));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const getReelsData = async (req, res) => {
  try {
    const currUserId = req._id;

    const currUser = await User.findById(currUserId).populate("followings");

    const reelsData = await Reels.find({
      owner: {
        $in: currUser.followings,
      },
    });

    return res.send(success(200, { reelsData }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

module.exports = {
  createReelController,
  getReelsData,
};
