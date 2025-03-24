const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
    },
    userEmail: {
        type: String,
        required: true,
    },
    orderId: {
        type: String,
        required: true,
    },
    provider: {
        type: String,
        enum: ["paystack", "korapay"],
        required: true,
    },
    reference: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "pending",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
