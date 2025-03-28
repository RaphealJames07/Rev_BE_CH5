const {promisify} = require("util");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");
// const sendEmail = require('../utils');
const templates = require("../utils/emailTemplates");

dotenv.config({path: "./config.env"});

const signToken = (id) =>
    jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };
    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

    res.cookie("jwt", token, cookieOptions);

    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user,
        },
    });
};

const genToken = async (id, time) => {
    const token = await jwt.sign(
        {
            userID: id,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: time,
        }
    );
    return token;
};

const decodeToken = async (token) => {
    try {
        const data = jwt.verify(token, process.env.JWT_SECRET); // No await needed
        const user = await User.findById(data.userID);
        return user;
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return null;
    }
};

exports.signup = catchAsync(async (req, res, next) => {
    // Create a new user without saving immediately
    // const {email,password,confirmPassword} = req.body;
    const {email, password, confirmPassword, ...otherFields} = req.body;
    const isEmail = await User.findOne({email});
    if (isEmail) {
        return next(new AppError("email already exists", 409));
    }
    if (!confirmPassword) {
        return next(new AppError("Please confirm your password", 400));
    }
    if (password !== confirmPassword) {
        return next(new AppError("Passwords do not match", 400));
    }

    const newUser = await User.create({email, password, ...otherFields});

    // const newUser = await User.create(req.body);
    const token = await genToken(newUser._id, "1d");
    // console.log(token);

    // Create the verification link
    const verificationLink = `${process.env.FRONTEND_URL}/verify/${token}`;

    // Send the verification email
    await sendEmail({
        email: newUser.email,
        subject: "Verify Your Account",
        html: templates.verifyEmailTemplate(
            verificationLink,
            newUser.firstName
        ),
    });

    res.status(201).json({
        status: "success",
        message: `Sign up successful! Please check ${newUser.email} to verify your account.`,
        token,
        data: {
            user: newUser,
        },
    });
});

exports.verifyUser = catchAsync(async (req, res, next) => {
    const {token} = req.params;

    const userInfo = await decodeToken(token);
    if (!userInfo) {
        return next(
            new AppError("Invalid or expired verification token.", 400)
        );
    }

    console.log(userInfo);

    userInfo.isVerified = true;
    await userInfo.save(); // Save the updated user

    res.status(200).json({
        status: "success",
        message: "Account verified successfully! You can now log in.",
    });
});

exports.resendVerificationMail = catchAsync(async (req, res, next) => {
    const {email} = req.body;
    const user = await User.findOne({email});
    if (user && !user.isVerified) {
        const token = await genToken(user._id, "1d");

        const verificationLink = `${process.env.FRONTEND_URL}/verify/${token}`;

        // Send the verification email
        await sendEmail({
            email: user.email,
            subject: "Verify Your Account",
            html: templates.verifyEmailTemplate(
                verificationLink,
                user.firstName
            ),
        });

        res.status(200).json({
            status: "success",
            message: `Verify link sent successful, Please check ${user.email} to verify your account.`,
        });
    } else if (user.isVerified) {
        return next(
            new AppError(
                `User with email "${user.email}" already verified`,
                400
            )
        );
    } else {
        res.status(404).json({
            message: "user with email not found",
        });
    }
});

exports.login = catchAsync(async (req, res, next) => {
    const {email, password} = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError("Please provide email and password", 400));
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({email}).select("+password");
    console.log(user);

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("Incorrect email or password", 401));
    }
    if (!user.isVerified) {
        return next(
            new AppError(
                "User not verified, Check for token or use the resend verification",
                401
            )
        );
    }
    // 3) if everything ok, send token to client
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };
    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

    res.cookie("jwt", token, cookieOptions);

    user.password = undefined;
    // createSendToken(user, 200, res);
    res.status(200).json({
        status: "success",
        token,
        data: {
            user,
        },
    });
});

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check of it's there
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return next(new AppError("You are not logged in, Please log in", 401));
    }

    // 2) Verificattion token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError(
                "The user belonging to this token does no longer exist",
                401
            )
        );
    }

    // 4) Check if user changed password after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError(
                "User recently changed password! Please log in again.",
                401
            )
        );
    }

    req.user = currentUser;
    next();
});

exports.restrictTo = (...roles) =>
    catchAsync(async (req, res, next) => {
        if (!roles) return next(new AppError("Roles not found", 404));
        // console.log(req.user.role);
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    "You do not have permission to perform this action",
                    403
                )
            );
        }
        next();
    });

exports.forgetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({email: req.body.email});

    if (!user) {
        return next(new AppError("There is no user with email address", 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});

    // 3) sent it to the user's email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // const message = `Forgot your password? Submit a PATCH request with your new password and confirmPassword to: ${resetUrl}. \nIf you didn't forget your password, please ignore this email`;
    try {
        await sendEmail({
            email: user.email,
            subject: "Reset Your Password",
            html: templates.resetPasswordTemplate(resetUrl, user.firstName),
        });
        res.status(200).json({
            status: "success",
            message: "Password reset link sent to your email.",
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});
        return next(new AppError("Error sending email. Try again later.", 500));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {$gt: Date.now()},
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError("Token is invalid or has expired", 400));
    }
    user.password = req.body.password;
    // user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changePasswordAt property for the user

    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select("+password");
    // console.log(user)

    // 2) Check if POSTed current password is correct
    if (
        !(await user.correctPassword(req.body.currentPassword, user.password))
    ) {
        return next(new AppError("Your current password is wrong.", 401));
    }
    // 3) If so, update password
    user.password = req.body.password;
    // user.confirmPassword = req.body.confirmPassword;
    await user.save();

    //4) Log user in, send JWT
    createSendToken(user, 200, res);
});
exports.deteleAllUser = catchAsync(async (req, res, next) => {
    await User.deleteMany();
    res.status(200).json({status: "success", message: "User deleted"});
});
