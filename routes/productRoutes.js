const express = require("express");
const {createProduct,getProduct,getAllProducts} = require("../controllers/productController");
const upload = require("../middlewares/upload");

const router = express.Router();

router.post("/create", upload.array("images", 5), createProduct);
router.get("/getProduct/:id",getProduct);
router.get("/getAllProduct",getAllProducts);

module.exports = router;
