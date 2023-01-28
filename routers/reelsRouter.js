const reelsController = require("../controllers/reelsController");
const requireUser = require("../middlewares/requireUser");
const router = require("express").Router();

router.post("/", requireUser, reelsController.createReelController);
router.get('/getReelsData', requireUser, reelsController.getReelsData)
module.exports = router;
