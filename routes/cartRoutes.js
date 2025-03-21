const express = require("express");
const cartController = require("../controllers/cartController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect); // Protect all cart routes

router.post("/add", cartController.addToCart);
router.get("/", cartController.getUserCart);
router.patch("/increase", cartController.increaseItemQTY);
router.patch("/decrease", cartController.decreaseItemQTY);
router.delete("/remove", cartController.removeItemFromCart);
router.delete("/clear", cartController.clearCart);

module.exports = router;
