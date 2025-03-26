/* eslint-disable prefer-destructuring */
const axios = require("axios");
const dotenv = require("dotenv");
const Payment = require("../models/paymentsModel");
const Cart = require("../models/cartsModel");
const Order = require("../models/orderModel");
// const {clearCart} = require("./cartsController");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");
const templates = require("../utils/emailTemplates");

dotenv.config({path: "./config.env"});

const formatDate = (date) =>
    new Date(date).toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });

exports.initializeTransaction = catchAsync(async (req, res, next) => {
    // eslint-disable-next-line prefer-const
    let {email, amount, method, orderId} = req.body;

    if (!email || !amount || !orderId) {
        return next(
            new AppError("Email, amount, and orderId are required", 400)
        );
    }
    if (![1, 2].includes(method)) {
        return next(new AppError("Invalid payment method", 400));
    }
    const cart = await Cart.findOne({user: req.user.id});
    if (cart.total !== amount) {
        return next(
            new AppError(
                `Payment amount less than required amount (${cart.total})`,
                400
            )
        );
    }
    let responseData;
    let provider;
    let reference;

    const generateOrderNumber = () =>
        `KORA-${Date.now()}-${Math.floor(Math.random() * 1000)}PAY`;
    const customerInfo = {
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
    };

    const koraData = {
        amount,
        reference: (reference = generateOrderNumber()),
        customer: customerInfo,
        currency: "NGN",
        channels: ["card", "bank_transfer", "pay_with_bank", "mobile_money"],
        default_channel: "card",
        narration: `Payment for order #${orderId}`,
        redirect_url: "http://localhost:5173/",
    };
    // notification_url: _webHookUrl,
    // console.log(koraData)

    if (method === 1) {
        // Paystack
        amount *= 100;
        provider = "paystack";
        const paystackResponse = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {email, amount},
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            }
        );
        responseData = paystackResponse.data.data;
        reference = responseData.reference;
    } else {
        // Korapay
        provider = "korapay";
        // const korapayResponse = await axios.post(
        //     "https://api.korapay.com/merchant/api/v1/charges/initialize",
        //     koraData,
        //     {
        //         headers: {
        //             Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}`,
        //         },
        //     }
        // );
        // responseData = korapayResponse;
        // console.log(responseData);
        // reference = responseData.reference;
        try {
            const korapayResponse = await axios.post(
                "https://api.korapay.com/merchant/api/v1/charges/initialize",
                koraData,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            responseData = korapayResponse.data; // Ensure you access `.data`
            reference = responseData.data.reference;
            console.log(responseData);
        } catch (error) {
            console.error(
                "Korapay Error:",
                error.response.data || error.message
            );
            return next(
                new AppError(
                    error.response.data.message ||
                        "Korapay initialization failed",
                    400
                )
            );
        }
    }

    // Save payment record
    // console.log(reference)
    const payment = await Payment.create({
        userEmail: req.user.email,
        userName: `${req.user.firstName} ${req.user.lastName}`,
        provider,
        reference,
        date: formatDate(new Date()),
        amount,
        status: "pending",
        orderId, // Link payment to order
    });
    res.status(200).json({
        status: "success",
        data: {
            accessData: responseData,
            paymentId: payment._id,
            method,
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

    const provider = method === "1" ? "paystack" : "korapay";
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
        // console.log(paystackVerify);
    } else {
        // Korapay verification (endpoint based on their docs)
        const korapayVerify = await axios.get(
            `https://api.korapay.com/merchant/api/v1/charges/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}`,
                },
            }
        );
        console.log(korapayVerify);
        verifyResponse = korapayVerify.data.data;
    }

    // Update payment record
    const payment = await Payment.findOne({reference, provider});
    if (!payment) {
        return next(new AppError("Payment record not found", 404));
    }

    // Find related order
    const order = await Order.findById(payment.orderId);
    if (!order) {
        return next(new AppError("Order not found", 404));
    }

    // Update payment record and create order if successful
    if (verifyResponse.status === "success") {
        payment.status = "success";
        await payment.save();

        // Update order with paymentData
        order.paymentData = {
            reference: payment.reference,
            provider: payment.provider,
            status: "success",
            amountPaid: payment.amount,
            paymentDate: payment.date,
        };
        order.status = "payment-confirmed";
        order.orderActivities.push({
            status: "payment-confirmed",
            message: "Payment has been successfully verified.",
            timestamp: formatDate(new Date()),
        });
        await order.save();

        await sendEmail({
            email: order.userData.email,
            subject: "Order Confirmation",
            html: templates.orderConfirmationTemplate(
                order.orderNumber,
                order.userData.firstName,
                order.cartData.items,
                order.cartData.totalAmount
            ),
        });

        await Cart.findOneAndDelete({user: req.user.id});
        return res.status(200).json({
            status: "success",
            message: "Payment verified and order updated",
            data: {payment: verifyResponse, order},
        });
    }
    // Payment failed
    payment.status = "failed";
    order.orderActivities.push({
        status: "payment-failed",
        message: "Payment verification failed. Please retry.",
        timestamp: formatDate(new Date()),
    });
    await payment.save();

    order.status = "payment-failed";
    await order.save();

    return next(new AppError("Payment verification failed", 400));
});
