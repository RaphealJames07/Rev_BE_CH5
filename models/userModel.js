const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, "Please enter your first name"],
            // trim: true,
        },
        lastName: {
            type: String,
            required: [true, "Please enter your last name"],
            // trim: true,
        },
        role: {
            type: String,
            enum: ['user', 'admin','driver'],
            default: 'user',
          },
        email: {
            type: String,
            required: [true, "Please enter your email"],
            unique: true,
            // trim: true,
            lowercase: true,
            match: [
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                "Please fill a valid email address",
            ],
            validate: [validator.isEmail, "Please fill a valid email address"],
        },
        photo: {
            type: String,
        },
        password: {
            type: String,
            required: [true, "Please enter your password"],
            minLength: 8,
            // trim: true,
            select: false,
        },
        
        passwordChangedAt: {
            type: Date,
        },
        passwordResetToken: String,
        passwordResetExpires: Date,
        active: {
            type: Boolean,
            default: true,
            select: false,
        },
        isVerified: {
            type: Boolean,
            default: false,
            // select: false,
        },
    },
    {timestamps: true}
);

userSchema.pre("save", async function (next) {
    // Only run this function if password was actually modified
    if (!this.isModified("password")) return next();

    // Create salt and hash
    this.password = await bcrypt.hash(this.password, 12);

    // Delete the confirmPassword Fielld
    this.confirmPassword = undefined;
    next();
});

userSchema.pre("save", function (next) {
    if (!this.isModified("password") || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function (next) {
    this.find({active: {$ne: false}});
    next();
});

userSchema.methods.correctPassword = async function (
    userPassword,
    systemPassword
) {
    return await bcrypt.compare(userPassword, systemPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        // console.log(changedTimestamp, JWTTimestamp);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// userSchema.methods.createSignUpToken = function () {
//     const token = crypto.randomBytes(32).toString("hex");

//     this.verifyToken = crypto.createHash("sha256").update(token).digest("hex");

//     console.log({token}, this.verifyToken);

//     this.verifyTokenExpires = Date.now() + 10 * 60 * 1000;

//     return token;
// };
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    console.log({resetToken}, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
