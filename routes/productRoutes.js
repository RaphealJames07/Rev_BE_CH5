const express = require("express");
const {
    createProduct,
    getProduct,
    getAllProducts,
    deleteProduct,
    updateProduct,
} = require("../controllers/productController");
const {protect, restrictTo} = require("../controllers/authController");
const upload = require("../middlewares/upload");

const router = express.Router();

router.post("/create", upload.array("images", 5), createProduct);
router.get("/getProduct/:id", getProduct);
router.delete("/deleteProduct/:id", protect, restrictTo("admin"), deleteProduct);
router.patch("/updateProduct/:id", protect, restrictTo("admin"), updateProduct);
router.get("/getAllProduct", getAllProducts);

module.exports = router;
