const User = require("../models/User");
const Post = require("../models/Post");
const { success, error } = require("../utils/responseWrapper");
const { mapPostOutput } = require("../utils/Utils");
const cloudinary = require("cloudinary").v2;

const createPostController = async (req, res) => {
  try {
    const { caption, postImg } = req.body;
    const owner = req._id;

    if (!caption || !postImg) {
      return res.send(error(400, "Caption and Post Image are required"));
    }

    if (!caption) {
      return res.send(error(400, "Caption is required"));
    }

    if (!postImg) {
      return res.send(error(400, "Post Image is required"));
    }

    const cloudImg = await cloudinary.uploader.upload(postImg, {
      folder: "postImg",
    });

    const user = await User.findById(req._id);

    const post = await Post.create({
      owner,
      caption,
      image: {
        publicId: cloudImg.public_id,
        url: cloudImg.url,
      },
    });

    user.posts.push(post._id);
    await user.save();

    return res.send(success(201, { post }));
  } catch (e) {
    res.send(error(500, e.message));
  }
};

const likeAndUnlikePostController = async (req, res) => {
  try {
    const { postId } = req.body;

    const curUserId = req._id;

    const post = await Post.findById(postId).populate("owner");
    if (!post) {
      return res.send(error(404, "Post not found"));
    }

    if (post.likes.includes(curUserId)) {
      const index = post.likes.indexOf(curUserId);
      post.likes.splice(index, 1);
    } else {
      post.likes.push(curUserId);
    }
    await post.save();
    return res.send(success(200, { post: mapPostOutput(post, req._id) }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const updatePostController = async (req, res) => {
  try {
    const { postId, caption } = req.body;
    const currUserId = req._id;

    const post = await Post.findById(postId)
      .populate("owner")
      .populate("commentsUserId")
      .populate("likes");
    if (!post) {
      return res.send(error(404, "Post not found"));
    }

    if (post.owner._id.toString() !== currUserId) {
      return res.send(error(403, "Only owner update their posts"));
    }

    if (caption) {
      post.caption = caption;
    }

    await post.save();
    return res.send(success(200, { post: mapPostOutput(post, req._id) }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const deletePostController = async (req, res) => {
  try {
    const { postId } = req.body;
    const currUserId = req._id;

    const post = await Post.findById(postId);
    const currUser = await User.findById(currUserId);
    if (!post) {
      return res.send(error(404, "Post not found"));
    }

    if (post.owner.toString() !== currUserId) {
      return res.send(error(403, "Only owner delete their posts"));
    }

    const index = currUser.posts.indexOf(postId);
    currUser.posts.splice(index, 1);

    await currUser.save();
    await post.remove();

    return res.send(success(200, "Posts deleted successfully"));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const getSpecificPostDetails = async (req, res) => {
  try {
    const { postId, name } = req.body;

    const post = await Post.findById(postId)
      .populate("owner")
      .populate("commentsUserId")
      .populate("likes");
    let element = [];
    for (let i = 0; i < post.commentsUserId.length; i++) {
      const a = {
        commentsUserId: post.commentsUserId[i],
        comments: post.comments[i],
      };
      element.push(a);
    }
    element.reverse();

    return res.send(
      success(200, { post: mapPostOutput(post, req._id, element) })
    );
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const postComment = async (req, res) => {
  try {
    const { postId, comment } = req.body;
    const currUserId = req._id;
    if (!postId) {
      return res.send(error(400, "Post ID is required"));
    }

    if (!comment) {
      return res.send(error(400, "Comment is required"));
    }

    const post = await Post.findById(postId);

    await post.commentsUserId.push(currUserId);
    await post.comments.push(comment);

    await post.save();

    return res.send(success(200, { post }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

module.exports = {
  createPostController,
  likeAndUnlikePostController,
  updatePostController,
  deletePostController,
  getSpecificPostDetails,
  postComment,
};
