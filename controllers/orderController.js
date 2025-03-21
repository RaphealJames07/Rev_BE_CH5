const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Utility to generate an order number (you can customize this)
const generateOrderNumber = () =>
    `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Create an order from the current cart after a successful payment
exports.createOrderFromCart = catchAsync(async (req, payment) => {
    // Get the user's cart
    const userCart = await Cart.findOne({user: req.user.id});
    if (!userCart || userCart.items.length === 0) {
        throw new AppError("Cart is empty", 400);
    }

    const order = await Order.create({
        orderNumber: generateOrderNumber(),
        user: req.user.id,
        payment: payment._id,
        items: userCart.items,
        totalAmount: userCart.total,
        status: "completed",
    });

    // Clear the user's cart
    await Cart.findOneAndDelete({user: req.user.id});

    return order;
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
