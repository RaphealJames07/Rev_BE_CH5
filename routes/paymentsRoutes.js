const express = require("express");
const paymentController = require("../controllers/paymentsController");
const {protect} = require("../controllers/authController");

const router = express.Router();

// Protect all payment routes
// router.use(protect);

// POST to initialize a transaction
router.post("/initialize", protect, paymentController.initializeTransaction);

// GET to verify a transaction; expects query parameters: ?reference=...&method=...
router.get("/verify",protect, paymentController.verifyTransaction);

module.exports = router;
