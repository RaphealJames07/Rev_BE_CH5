const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: [true, "Please enter product name"],
        trim: true,
    },
    stockQuantity: {
        type: Number,
        required: [true, "Please enter stock quantity"],
        min: [0, "Stock quantity cannot be negative"],
    },
    images: {
        type: [String],
        required: [true, "Please provide at least one image"],
    },
    imagePaths: {
        type: String,
    },
    sizes: {
        type: [
            {
                size: {
                    us: {type: Number, required: true},
                    uk: {type: Number, required: true},
                },
                price: {
                    type: Number,
                    required: true,
                },
                stock: {
                    type: Number,
                    required: true,
                    min: [0, "Stock cannot be negative"],
                },
            },
        ],
        required: [true, "Please provide at least two different sizes"],
        validate: [
            (sizes) => sizes.length >= 2,
            "A product must have at least two sizes.",
        ],
    },
    basePrice: {
        type: Number,
        required: [true, "Please provide a base price"],
        min: [0, "Base price cannot be negative"],
    },
    category: {
        type: String,
        enum: ["Sneakers", "Shoes", "Boots", "Slippers"],
        required: [true, "Please select a category"],
    },
    brand: {
        type: String,
        required: [true, "Please provide a brand name"],
    },
    type: {
        type: String,
        required: true,
    },
    variants: [
        {
            name: {type: String, required: true},
            colors: [
                {
                    name: {type: String, required: true},
                    hexCode: {type: String},
                },
            ],
        },
    ],
    shortDescription: {
        type: String,
        required: [true, "Please enter a short description"],
        trim: true,
    },
    fullDescription: {
        type: String,
        required: [true, "Please enter a full description"],
        trim: true,
    },
    weight: {
        type: Number,
        required: [true, "Please enter weight"],
    },
    sku: {
        type: String,
        required: [true, "Please enter SKU"],
        unique: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        
    },
    lastUpdated: {
        type: String,
        default: null,
    },
    updateHistory: [
        {
            updatedBy: { type: String, required: true },
            updatedAt: { type: String, required: true },
            changes: { type: Object, required: true }, // Stores the updated fields
        },
    ],
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
