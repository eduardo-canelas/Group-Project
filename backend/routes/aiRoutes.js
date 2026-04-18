const express = require("express");
const requireCurrentUser = require("../middleware/requireCurrentUser");
const { generateOpsBriefing } = require("../controllers/aiController");

const router = express.Router();

router.use(requireCurrentUser);
router.post("/ops-briefing", generateOpsBriefing);

module.exports = router;
