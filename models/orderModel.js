const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        userData: {
            firstName: String,
            lastName: String,
            email: String,
            phone: String,
        },
        paymentData: {
            reference: {type: String, default: null},
            provider: {
                type: String,
                enum: ["paystack", "korapay"],
                default: null,
            },
            status: {
                type: String,
                enum: ["pending", "success", "failed"],
                default: "pending",
            },
            amountPaid: {type: Number, default: 0},
            paymentDate: {type: Date, default: null},
            transactionId: {type: String, default: null},
        },
        cartData: {
            items: [
                {
                    product: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Product",
                    },
                    quantity: Number,
                    image: [String],
                    category: String,
                    brand: String,
                    productType: String,
                    unitPrice: {
                        type: Number,
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
            totalAmount: {
                type: Number,
                required: true,
            },
        },
        shippingData: {
            address: {type: String, required: true},
            city: {type: String, required: true},
            state: {type: String, required: true},
            postalCode: {type: String, required: true},
            deliveryStatus: {
                type: String,
                enum: ["pending", "shipped", "out-for-delivery", "delivered"],
                default: "pending",
            },
            trackingNumber: {type: String, default: null},
        },
        deliveryMode: Number,
        status: {
            type: String,
            enum: [
                "initialized",
                "payment-confirmed",
                "processing-order",
                "ready-for-pickup",
                "on-delivery",
                "delivered",
                "cancelled",
                "returned",
                "payment-failed",
            ],
            default: "initialized",
        },
        orderActivities: [
            {
                status: {
                    type: String,
                    enum: [
                        "initialized",
                        "payment-confirmed",
                        "processing-order",
                        "ready-for-pickup",
                        "on-delivery",
                        "delivered",
                        "cancelled",
                        "returned",
                        "payment-failed",
                    ],
                },
                timestamp: {
                    type: String,
                    default: null,
                },
                message: {
                    type: String,
                    default: null,
                },
            },
        ],
        isRefunded: {type: Boolean, default: false},
        isCancelled: {type: Boolean, default: false},
        cancellationReason: {type: String, default: null},
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {timestamps: true}
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
