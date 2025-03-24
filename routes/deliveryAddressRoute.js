const express = require("express");
const deliveryAddressController = require("../controllers/deliveryAddressController");
const {protect} = require("../controllers/authController");

const router = express.Router();

router.use(protect); // Protect all routes (user must be logged in)

router.post("/createNew", deliveryAddressController.createAddress);
router.get("/getAll", deliveryAddressController.getAllAddresses);
router.get("/:id", deliveryAddressController.getAddressById);
router.put("/:id", deliveryAddressController.updateAddress);
router.delete("/:id", deliveryAddressController.deleteAddress);
router.patch("/:id/set-default", deliveryAddressController.setDefaultAddress);

module.exports = router;
