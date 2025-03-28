const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        status: "success",
        result: users.length,
        data: {
            users,
        },
    });
});

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.confirmPassword) {
        return next(
            new AppError(
                "This route is not for password updates. Please use /updatePassword.",
                400
            )
        );
    }
    // 2) Filtered out unwanted fields names not allowed to be updated
    const filteredBody = filterObj(req.body, "firstName", "lastName");

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        filteredBody,
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser,
            updatedBy: req.user.email,
        },
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    const {password} = req.body;
    const {email} = req.user;
    if (!password) {
        return next(
            new AppError(
                `To delete account, enter your correct user password`,
                400
            )
        );
    }
    const user = await User.findOne({email}).select("+password");
    // console.log(user);
    if (!user) {
        return next(new AppError(`User not found`, 404));
    }
    if (!(await user.correctPassword(password, user.password))) {
        return next(new AppError("Incorrect password", 401));
    }

    res.status(204).json({
        status: "success",
        data: null,
    });
});

exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(
            new AppError(`User with ID: ${req.params.id} not found`, 404)
        );
    }

    res.status(200).json({
        status: "success",
        result: user.length,
        data: {
            user,
        },
    });
});

exports.getUserCart = catchAsync(async (req, res, next) =>
    res.status(200).json({
        status: "success",
        message: "This endpoint is working!",
    })
);
