// const {default: mongoose} = require("mongoose");
const Cart = require("../models/cartsModel");
const Product = require("../models/productModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Add item to cart
exports.addToCart = catchAsync(async (req, res, next) => {
    const {productId, sizeId, quantity} = req.body;
    const userId = req.user.id;

    // Fetch product from DB
    const product = await Product.findById(productId);
    if (!product) {
        return next(new AppError("Product not found", 404));
    }

    // Find the selected size
    const selectedSize = product.sizes.find(
        (size) => size._id.toString() === sizeId.toString()
    );
    // console.log(req.body);
    if (!selectedSize) {
        return next(new AppError("Invalid size selection", 400));
    }

    // Check if enough stock is available
    if (quantity > selectedSize.stock) {
        return next(
            new AppError(
                `Only ${selectedSize.stock} left in stock for this size`,
                400
            )
        );
    }

    // Find or create cart
    let cart = await Cart.findOne({user: userId});
    if (!cart) {
        cart = new Cart({user: userId, items: [], total: 0});
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find(
        (item) =>
            item.product.toString() === productId &&
            item.sizeInfo.sizeId.toString() === sizeId
    );
    console.log(product);
    if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.totalPrice =
            existingItem.quantity * existingItem.unitPrice;
    } else {
        cart.items.push({
            product: productId,
            sizeInfo: {
                size: selectedSize.size,
                price: selectedSize.price,
                sizeId: selectedSize._id,
            },
            quantity,
            image: product.images,
            category: product.category,
            brand: product.brand,
            productType: product.type,
            unitPrice: selectedSize.price,
            totalPrice: selectedSize.price * quantity,
        });
    }

    // Recalculate cart total
    cart.total = cart.items.reduce(
        (acc, item) => acc + item.quantity * item.unitPrice,
        0
    );

    await cart.save();

    res.status(200).json({
        status: "success",
        data: {length: cart.items.length, cart},

        message: `${product.productName} (Size: ${selectedSize.size.us}) added to cart successfully`,
    });
});

// Get user's cart
exports.getUserCart = catchAsync(async (req, res, next) => {
    const cart = await Cart.findOne({user: req.user.id});
    // console.log(cart);
    if (!cart) {
        return res.status(200).json({
            status: "success",
            data: {cart: [], total: 0, length: 0},
            message: "Cart is empty",
        });
    }

    res.status(200).json({
        status: "success",
        data: {length: cart.items.length, cart},
    });
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
    cartItem.totalPrice += cartItem.unitPrice;
    cart.total += cartItem.unitPrice;

    await cart.save();

    res.status(200).json({
        status: "success",
        data: {length: cart.items.length, cart},
    });
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
        cartItem.totalPrice -= cartItem.unitPrice;
        cart.total -= cartItem.unitPrice;
    } else {
        cart.items = cart.items.filter(
            (item) => item.product.toString() !== productId
        );
    }

    await cart.save();

    res.status(200).json({
        status: "success",
        data: {length: cart.items.length, cart},
    });
});

// Remove item from cart
exports.removeItemFromCart = catchAsync(async (req, res, next) => {
    const {productId} = req.body;
    const product = await Product.findById(productId);
    const cart = await Cart.findOne({user: req.user.id});
    if (!cart) return next(new AppError("Cart not found", 404));
    const check = cart.items.find(
        (item) => item.product.toString() === productId
    );
    if (!check)
        return next(
            new AppError(`${product.productName} not found in cart`, 404)
        );
    cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId
    );
    cart.total = cart.items.reduce(
        (acc, item) => acc + item.quantity * item.unitPrice,
        0
    );
    if (!product) {
        return next(new AppError("Product not found", 404));
    }
    await cart.save();
    res.status(200).json({
        status: "success",
        message: `${product.productName} removed from cart`,
        data: {length: cart.items.length, cart},
    });
});

// Clear cart
exports.clearCart = catchAsync(async (req, res, next) => {
    await Cart.findOneAndDelete({user: req.user.id});

    return res.status(200).json({
        status: "success",
        data: {cart: [], total: 0, length: 0},
        message: "Cart is empty",
    });
});
