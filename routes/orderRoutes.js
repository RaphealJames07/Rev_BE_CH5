const express = require("express");
const orderController = require("../controllers/orderController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.use(protect); // Protect all routes (user must be logged in)

// Step 1: Initialize Order
router.post("/initialize", orderController.initializeOrder);

// Step 2: Update Order with Payment Data
router.patch("/update-payment", orderController.updateOrderPayment);

module.exports = router;
