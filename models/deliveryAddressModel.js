const mongoose = require("mongoose");

const deliveryAddressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        },
        postalCode: {
            type: String,
            required: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    {timestamps: true}
);

const DeliveryAddress = mongoose.model(
    "DeliveryAddress",
    deliveryAddressSchema
);
module.exports = DeliveryAddress;
