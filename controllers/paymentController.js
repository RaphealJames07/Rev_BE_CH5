/* eslint-disable prefer-destructuring */
const axios = require("axios");
const Payment = require("../models/paymentModel");
// const Order = require("../models/orderModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const {createOrderFromCart} = require("./orderController");

exports.initializeTransaction = catchAsync(async (req, res, next) => {
    // Expecting: email, amount (in lowest currency denomination), and method (1 for Paystack, 2 for Korapay)
    const {email, amount, method} = req.body;

    if (![1, 2].includes(method)) {
        return next(new AppError("Invalid payment method", 400));
    }

    let responseData;
    let provider;
    let reference;

    if (method === 1) {
        // Initialize with Paystack
        provider = "paystack";
        const paystackResponse = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {email, amount},
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );
        responseData = paystackResponse.data.data;
        reference = responseData.reference;
    } else {
        // Initialize with Korapay using Checkout Standard
        provider = "korapay";
        const korapayPayload = {
            email,
            amount,
            // You may add more fields (like description, metadata) as required by Korapay docs
            callback_url:
                process.env.KORAPAY_CALLBACK_URL ||
                "https://yourdomain.com/payment/verify",
        };
        const korapayResponse = await axios.post(
            "https://api.korapay.com/checkout/initialize",
            korapayPayload,
            {
                headers: {
                    Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );
        responseData = korapayResponse.data.data;
        reference = responseData.reference; // Ensure that the response returns a unique reference
    }

    // Create a payment record in the database
    const payment = await Payment.create({
        user: req.user.id,
        provider,
        reference,
        amount,
        status: "pending",
    });

    res.status(200).json({
        status: "success",
        data: {
            // For Paystack, responseData contains access_code; for Korapay, it might contain checkout_url or token
            accessData: responseData,
            paymentId: payment._id,
        },
    });
});

exports.verifyTransaction = catchAsync(async (req, res, next) => {
    // Expecting query parameters: reference and method (as "1" or "2")
    const {reference, method} = req.query;

    if (!reference || !method) {
        return next(
            new AppError("Reference and payment method are required", 400)
        );
    }

    if (!["1", "2"].includes(method)) {
        return next(new AppError("Invalid payment method", 400));
    }

    const provider = parseInt(method, 10) === 1 ? "paystack" : "korapay";
    let verifyResponse;

    if (provider === "paystack") {
        const paystackVerify = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            }
        );
        verifyResponse = paystackVerify.data.data;
    } else {
        // Korapay verification (endpoint based on their docs)
        const korapayVerify = await axios.get(
            `https://api.korapay.com/transaction/verify?reference=${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}`,
                },
            }
        );
        verifyResponse = korapayVerify.data.data;
    }

    // Update payment record
    const payment = await Payment.findOne({reference, provider});
    if (!payment) {
        return next(new AppError("Payment record not found", 404));
    }

    // Update payment record and create order if successful
    if (verifyResponse.status === "success") {
        payment.status = "success";
        await payment.save();

        // Create order from cart and clear the cart
        const order = await createOrderFromCart(req, payment);

        return res.status(200).json({
            status: "success",
            message: "Payment verified and order created",
            data: {payment: verifyResponse, order},
        });
    }
    payment.status = "failed";
    await payment.save();
    return next(new AppError("Payment verification failed", 400));
});
