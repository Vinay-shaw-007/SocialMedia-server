const postsController = require("../controllers/postsController");
const requireUser = require("../middlewares/requireUser");
const router = require("express").Router();

router.post("/", requireUser, postsController.createPostController);
router.post("/like", requireUser, postsController.likeAndUnlikePostController);
router.put("/", requireUser, postsController.updatePostController);
router.post("/delete", requireUser, postsController.deletePostController);
router.post("/getSpecificPostDetails", requireUser, postsController.getSpecificPostDetails);
router.post("/postComment", requireUser, postsController.postComment);

module.exports = router;
