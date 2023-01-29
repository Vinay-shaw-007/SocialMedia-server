const Post = require("../models/Post");
const Stories = require("../models/Stories");
const User = require("../models/User");
const { success, error } = require("../utils/responseWrapper");
const { mapPostOutput } = require("../utils/Utils");
const cloudinary = require("cloudinary").v2;

const followOrUnfollowUserController = async (req, res) => {
  try {
    const { userIdToFollow } = req.body;
    const currUserId = req._id;

    const userToFollow = await User.findById(userIdToFollow);
    const currUser = await User.findById(currUserId);

    if (currUserId === userIdToFollow) {
      return res.send(error(409, " Users cannot follow themselves"));
    }

    if (!userToFollow) {
      return res.send(error(404, "User to follow not found"));
    }

    if (currUser.followings.includes(userIdToFollow)) {
      //already followed
      const followingIndex = currUser.followings.indexOf(userIdToFollow);
      currUser.followings.splice(followingIndex, 1);

      const followerIndex = userToFollow.followers.indexOf(currUser);
      userToFollow.followers.splice(followerIndex, 1);
    } else {
      // follow user
      userToFollow.followers.push(currUserId);
      currUser.followings.push(userIdToFollow);
    }
    await userToFollow.save();
    await currUser.save();

    return res.send(success(200, { user: userToFollow }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const getPostOfFollowing = async (req, res) => {
  try {
    const currUserId = req._id;

    const currUser = await User.findById(currUserId)
      .populate("followings")
      .populate("storiesId");

    const fullPosts = await Post.find({
      owner: {
        $in: currUser.followings,
      },
    }).populate("owner");

    const followerStories = await Stories.find({
      owner: {
        $in: currUser.followings,
      },
    }).populate("owner");

    const posts = fullPosts
      .map((item) => mapPostOutput(item, req._id, item.commentsUserId))
      .reverse();

    const followingsIds = currUser.followings.map((item) => item._id);

    followingsIds.push(req._id);

    const suggestions = await User.find({
      _id: {
        $nin: followingsIds,
      },
    });

    return res.send(
      success(200, { ...currUser._doc, suggestions, posts, followerStories })
    );
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const getMyPosts = async (req, res) => {
  try {
    const currUserId = req._id;
    const allUserPosts = await Post.find({
      owner: currUserId,
    }).populate("likes");

    return res.send(success(200, { allUserPosts }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const getUserPosts = async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.send(error(400, "UserId is required"));
    }
    const allUserPosts = await Post.find({
      owner: userId,
    }).populate("likes");

    return res.send(success(200, { allUserPosts }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const deleteMyProfile = async (req, res) => {
  try {
    const curUserId = req._id;
    const curUser = await User.findById(curUserId);

    // delete all posts
    await Post.deleteMany({
      owner: curUserId,
    });

    // removed myself from followers' followings
    curUser.followers.forEach(async (followerId) => {
      const follower = await User.findById(followerId);
      const index = follower.followings.indexOf(curUserId);
      if (index !== undefined && index !== -1) {
        follower.followings.splice(index, 1);
        await follower.save();
      }
    });

    // remove myself from my followings' followers
    curUser.followings.forEach(async (followingId) => {
      const following = await User.findById(followingId);
      const index = following.followers.indexOf(curUserId);
      if (index !== undefined && index !== -1) {
        following.followers.splice(index, 1);
        await following.save();
      }
    });

    // remove myself from all likes
    const allPosts = await Post.find();
    allPosts.forEach(async (post) => {
      const index = post.likes.indexOf(curUserId);
      post.likes.splice(index, 1);
      await post.save();
    });

    // delete user
    await curUser.remove();

    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
    });

    return res.send(success(200, "user deleted"));
  } catch (error) {
    return res.send(error(500, e.message));
  }
};

const getMyInfo = async (req, res) => {
  try {
    const user = await User.findById(req._id);
    return res.send(success(200, { user }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, bio, userImg } = req.body;

    const user = await User.findById(req._id);

    if (name) {
      user.name = name;
    }

    if (bio) {
      user.bio = bio;
    }

    if (userImg) {
      const cloudImg = await cloudinary.uploader.upload(userImg, {
        folder: "ProfileImage",
      });
      user.avatar = {
        url: cloudImg.secure_url,
        publicId: cloudImg.public_id,
      };
    }

    await user.save();

    return res.send(success(200, { user }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await User.findById(userId)
      .populate({
        path: "posts",
        populate: {
          path: "owner",
        },
      })
      .populate("reelId");
    const fullPosts = user.posts;
    const posts = fullPosts
      .map((item) => mapPostOutput(item, req._id))
      .reverse();

    return res.send(success(200, { ...user._doc, posts }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

module.exports = {
  followOrUnfollowUserController,
  getPostOfFollowing,
  getMyPosts,
  getUserPosts,
  deleteMyProfile,
  getMyInfo,
  updateUserProfile,
  getUserProfile,
};
