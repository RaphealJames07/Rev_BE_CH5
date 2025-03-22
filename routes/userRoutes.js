const express = require("express");
const {
    deleteMe,
    updateMe,
    getAllUsers,
    getUser,getUserCart
} = require("../controllers/userController");
const {
    signup,
    login,
    forgetPassword,
    resetPassword,
    protect,
    restrictTo,
    updatePassword,
    verifyUser,
    resendVerificationMail,

} = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgetPassword", forgetPassword);
router.patch("/resetPassword/:token", resetPassword);
router.get("/verify/:token", verifyUser);
router.post("/resendVerification", resendVerificationMail);

router.patch("/updatePassword", protect, updatePassword);
router.get("/getCart", protect, getUserCart);
router.patch("/updateUser", protect, updateMe);
router.delete("/deleteUser", protect, restrictTo("admin"), deleteMe);
router.route("/").get(protect, restrictTo("admin"), getAllUsers);
router.route("/:id").get(protect, restrictTo("admin"), getUser);

module.exports = router;
