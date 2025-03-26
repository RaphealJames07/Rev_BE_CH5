const Order = require("../models/orderModel");
const DeliveryAddress = require("../models/deliveryAddressModel");
const Cart = require("../models/cartsModel");
const Payment = require("./paymentsController");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const {formatDate} = require("../middlewares/authMiddleware");

// Utility to generate an order number (you can customize this)
const generateOrderNumber = () =>
    `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

exports.initializeOrder = catchAsync(async (req, res, next) => {
    const {addressId, deliveryMode} = req.body;
    const userId = req.user.id;

    // Fetch address details
    const address = await DeliveryAddress.findOne({
        _id: addressId,
        user: userId,
    });
    if (!address) {
        return next(new AppError("Delivery address not found", 404));
    }

    const cartData = await Cart.findOne({user: req.user.id});

    // Create order with status "initialized" and empty paymentData
    const order = await Order.create({
        orderNumber: generateOrderNumber(), // Unique order number
        userId,
        userData: {
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
        },
        paymentData: {}, // Empty at this stage
        shippingData: {
            address: address.address,
            city: address.city,
            state: address.state,
            country: address.country,
            postalCode: address.postalCode,
        },
        cartData: {
            items: cartData.items,
            totalAmount: cartData.total,
        },
        orderActivities: [
            {
                status: "initialized",
                timestamp: formatDate(new Date()),
                message: `Your order has been created, awaiting payment`,
            },
        ],
        deliveryMode,
        status: "initialized",
    });

    res.status(201).json({
        status: "success",
        data: order,
    });
});

exports.updateOrderPayment = catchAsync(async (req, res, next) => {
    const {orderId, reference, provider} = req.body;

    // Fetch payment details
    const payment = await Payment.findOne({reference, provider});
    if (!payment) {
        return next(new AppError("Payment record not found", 404));
    }

    // Update order with paymentData and status
    const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
            paymentData: {
                reference: payment.reference,
                provider: payment.provider,
                status: payment.status,
                amountPaid: payment.amount,
                currency: payment.currency,
                paymentDate: payment.createdAt,
            },
            
            status:
                payment.status === "successful"
                    ? "payment-confirmed"
                    : "payment-failed",
        },
        {new: true}
    );

    res.status(200).json({
        status: "success",
        data: updatedOrder,
    });
});

// Admin: Get all orders
exports.getAllOrders = catchAsync(async (req, res, next) => {
    const orders = await Order.find().populate(
        "user",
        "email firstName lastName"
    );
    res.status(200).json({
        status: "success",
        results: orders.length,
        data: {orders},
    });
});

// User: Get logged-in user's orders
exports.getMyOrders = catchAsync(async (req, res, next) => {
    const orders = await Order.find({user: req.user.id}).populate(
        "payment",
        "reference status"
    );
    res.status(200).json({
        status: "success",
        results: orders.length,
        data: {orders},
    });
});

// Get order details (for a single order)
exports.getOrder = catchAsync(async (req, res, next) => {
    const order = await Order.findOne({_id: req.params.id, user: req.user.id})
        .populate("payment", "reference status")
        .populate("user", "email firstName lastName");

    if (!order) {
        return next(new AppError("Order not found", 404));
    }

    res.status(200).json({
        status: "success",
        data: {order},
    });
});
