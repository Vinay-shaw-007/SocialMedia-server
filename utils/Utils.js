const ta = require("time-ago");
const mapPostOutput = (post, userId, element) => {
  return {
    _id: post._id,
    caption: post.caption,
    image: post.image,
    owner: {
      _id: post.owner._id,
      name: post.owner.name,
      avatar: post.owner.avatar,
    },
    likesCount: post.likes.length,
    commentsCount: post.commentsUserId.length,
    isLiked: post.likes.includes(userId),
    timeAgo: ta.ago(post.createdAt),
    timeAgoUpdated: ta.ago(post.updatedAt),
    commentDetails: element,
    likes: post.likes,
  };
};

module.exports = {
  mapPostOutput,
};
