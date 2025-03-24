const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            image: [String],
            category: String,
            brand: String,
            productType: String,
            quantity: {
                type: Number,
                required: true,
                min: 1,
                default: 1,
            },
            unitPrice: {
                type: Number,
                required: true,
            },
            totalPrice: {
                type: Number,
            },
            sizeInfo: {
                size: {
                    us: {type: Number},
                    uk: {type: Number},
                },
                price: Number,
                sizeId: String,
            },
        },
    ],
    total: {
        type: Number,
        default: 0,
    },
    length: {
        type: Number,
    },
});

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
