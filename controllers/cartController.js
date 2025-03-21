const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Add item to cart
exports.addToCart = catchAsync(async (req, res, next) => {
    const {productId, quantity} = req.body;
    const userId = req.user.id;

    const product = await Product.findById(productId);
    if (!product) {
        return next(new AppError("Product not found", 404));
    }

    let cart = await Cart.findOne({user: userId});
    if (!cart) {
        cart = new Cart({user: userId, items: [], total: 0});
    }

    const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
    );
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.items.push({product: productId, quantity, price: product.price});
    }

    cart.total = cart.items.reduce(
        (acc, item) => acc + item.quantity * item.price,
        0
    );
    await cart.save();

    res.status(200).json({status: "success", data: cart});
});

// Get user's cart
exports.getUserCart = catchAsync(async (req, res, next) => {
    const cart = await Cart.findOne({user: req.user.id}).populate(
        "items.product"
    );
    if (!cart) {
        return next(new AppError("Cart not found", 404));
    }
    res.status(200).json({status: "success", data: cart});
});

// Increase item quantity
exports.increaseItemQTY = catchAsync(async (req, res, next) => {
    const {productId} = req.body;
    const cart = await Cart.findOne({user: req.user.id});

    if (!cart) return next(new AppError("Cart not found", 404));

    const cartItem = cart.items.find(
        (item) => item.product.toString() === productId
    );

    if (!cartItem) return next(new AppError("Product not in cart", 404));

    cartItem.quantity += 1; 
    cart.total += cartItem.price;

    await cart.save();

    res.status(200).json({status: "success", data: cart});
});

// Decrease item quantity
exports.decreaseItemQTY = catchAsync(async (req, res, next) => {
    const {productId} = req.body;
    const cart = await Cart.findOne({user: req.user.id});

    if (!cart) return next(new AppError("Cart not found", 404));

    const cartItem = cart.items.find(
        (item) => item.product.toString() === productId
    );

    if (!cartItem) return next(new AppError("Product not in cart", 404));

    if (cartItem.quantity > 1) {
        cartItem.quantity -= 1; 
        cart.total -= cartItem.price;
    } else {
        cart.items = cart.items.filter(
            (item) => item.product.toString() !== productId
        );
    }

    await cart.save();

    res.status(200).json({status: "success", data: cart});
});

// Remove item from cart
exports.removeItemFromCart = catchAsync(async (req, res, next) => {
    const {productId} = req.body;
    const cart = await Cart.findOne({user: req.user.id});
    if (!cart) return next(new AppError("Cart not found", 404));

    cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId
    );
    cart.total = cart.items.reduce(
        (acc, item) => acc + item.quantity * item.price,
        0
    );
    await cart.save();
    res.status(200).json({status: "success", data: cart});
});

// Clear cart
exports.clearCart = catchAsync(async (req, res, next) => {
    await Cart.findOneAndDelete({user: req.user.id});
    res.status(200).json({status: "success", message: "Cart cleared"});
});
