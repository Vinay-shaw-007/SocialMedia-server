const requireUser = require("../middlewares/requireUser");
const storiesController = require("../controllers/storiesController");
const router = require("express").Router();

router.post("/uploadStories", requireUser, storiesController.uploadStories);

router.post("/fetchStories", requireUser, storiesController.fetchStories);

module.exports = router;
