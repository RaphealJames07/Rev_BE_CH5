const express = require("express");
const paymentController = require("../controllers/paymentController");
const {protect} = require("../middlewares/authMiddleware");

const router = express.Router();

// Protect all payment routes
router.use(protect);

// POST to initialize a transaction
router.post("/initialize", paymentController.initializeTransaction);

// GET to verify a transaction; expects query parameters: ?reference=...&method=...
router.get("/verify", paymentController.verifyTransaction);

module.exports = router;
