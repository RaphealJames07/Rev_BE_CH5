const express = require("express");
const {
    deleteMe,
    updateMe,
    getAllUsers,
    getUser,
} = require("../controllers/userController");
const {
    signup,
    login,
    forgetPassword,
    resetPassword,
    protect,
    restrictTo,
    updatePassword,
    verifyUser
} = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgetPassword", forgetPassword);
router.patch("/resetPassword/:token", resetPassword);
router.patch("/verify/:token", verifyUser);
router.patch("/updatePassword", protect, updatePassword);

router.patch("/updateMe", protect, updateMe);
router.delete("/deleteMe",restrictTo('admin'), protect, deleteMe);

router.route("/").get(getAllUsers);
router.route("/:id").get(getUser);

module.exports = router;
