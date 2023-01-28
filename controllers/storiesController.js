const Stories = require("../models/Stories");
const User = require("../models/User");
const { success, error } = require("../utils/responseWrapper");
const cloudinary = require("cloudinary").v2;

const uploadStories = async (req, res) => {
  try {
    const { stories } = req.body;
    const owner = req._id;
    if (!stories || stories.length == 0) {
      return res.send(error(404, "Images not found"));
    }

    const user = await User.findById(owner);
    const userStoryId = user.storiesId;

    const storyAlreadyPresent = await Stories.findById(userStoryId);

    const ownerStories = await Promise.all(
      stories.map((file) =>
        cloudinary.uploader.upload(file, { folder: "stories" })
      )
    );

    const storiesData = ownerStories.map(({ public_id, url }) => ({
      publicId: public_id,
      url,
    }));

    if (!storyAlreadyPresent) {
      //if user is creating storeies for the first time....
      const story = await Stories.create({
        owner: req._id,
        stories: storiesData,
      });

      user.storiesId = story._id;
      await user.save();

      // This code use to remove the dupicate entries that created when a user upload its stories for the first time..
      const removeDuplicateStoriesObject = await Stories.find({
        owner,
      });

      removeDuplicateStoriesObject.map((item) => {
        if (item.stories.length == 0) {
          item.remove();
        }
      });
    } else {
      // if user already created his/her stories and want to add more....
      storiesData.forEach((stories) => {
        storyAlreadyPresent.stories.push(stories);
      });
      await storyAlreadyPresent.save();
    }

    return res.send(success(200, `Successfully added ${stories.length} stories`));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

const fetchStories = async (req, res) => {
  try {
    const { storiesId } = req.body;
    console.log('backend stories id', storiesId);
    console.log('backend stories body', req.body);
    if (!storiesId) {
      return res.send(error(404, "Stories Id is required"));
    }

    const allStories = await Stories.findById(storiesId);
    return res.send(success(200, { allStories }));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

module.exports = {
  uploadStories,
  fetchStories,
};
