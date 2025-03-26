const express = require("express");
const {
    getUserCart,
    addToCart,
    clearCart,
    decreaseItemQTY,
    increaseItemQTY,
    removeItemFromCart,
} = require("../controllers/cartsController");
const {protect} = require("../controllers/authController");

const router = express.Router();

router.post("/add", protect, addToCart);
router.get("/get", protect, getUserCart);
router.patch("/increase", protect, increaseItemQTY);
router.patch("/decrease", protect, decreaseItemQTY);
router.delete("/remove/:productId", protect, removeItemFromCart);
router.delete("/clear", protect, clearCart);

module.exports = router;
