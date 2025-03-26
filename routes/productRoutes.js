const express = require("express");
const multer = require("multer");
const {
    createProduct,
    batchProductUpload,
    getProduct,
    getAllProducts,
    deleteProduct,
    updateProduct,
} = require("../controllers/productController");
const {protect, restrictTo} = require("../controllers/authController");
const upload = require("../middlewares/upload");
const parseExcel = require("../middlewares/parseMiddleware");

const tempUpload = multer({dest: "uploads/"}); // Temporary storage for uploaded files



const router = express.Router();

router.post("/create", upload.array("images", 5), createProduct);
router.get("/getProduct/:id", getProduct);
router.post(
    "/batchUpload",
    protect, 
    tempUpload.single("sheets"),
    parseExcel.parseExcel, 
    batchProductUpload 
);
router.delete("/deleteProduct/:id", protect, restrictTo("admin"), deleteProduct);
router.patch("/updateProduct/:id", protect, restrictTo("admin"), updateProduct);
router.get("/getAllProduct", getAllProducts);

module.exports = router;
