const DeliveryAddress = require("../models/deliveryAddressModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// 🚀 Create a new delivery address
exports.createAddress = catchAsync(async (req, res, next) => {
    const {address, city, state, country, postalCode} = req.body;
    const userId = req.user.id;

    // Get existing addresses for the user
    const existingAddresses = await DeliveryAddress.find({user: userId});

    // Limit check: Max 5 addresses
    if (existingAddresses.length >= 5) {
        return next(
            new AppError("You can only have up to 5 delivery addresses", 400)
        );
    }

    // Check if this should be the default address
    // eslint-disable-next-line no-unneeded-ternary
    const isDefault = existingAddresses.length === 0 ? true : false;

    const newAddress = await DeliveryAddress.create({
        user: userId,
        address,
        city,
        state,
        country,
        postalCode,
        isDefault,
    });

    res.status(201).json({
        status: "success",
        data: newAddress,
    });
});

// 🚀 Get all addresses for a user
exports.getAllAddresses = catchAsync(async (req, res, next) => {
    const addresses = await DeliveryAddress.find({user: req.user.id});

    res.status(200).json({
        status: "success",
        data: addresses,
    });
});

// 🚀 Get a single address by ID
exports.getAddressById = catchAsync(async (req, res, next) => {
    const address = await DeliveryAddress.findOne({
        _id: req.params.id,
        user: req.user.id,
    });

    if (!address) {
        return next(new AppError("Address not found", 404));
    }

    res.status(200).json({
        status: "success",
        data: address,
    });
});

// 🚀 Update an address
exports.updateAddress = catchAsync(async (req, res, next) => {
    const {street, lga, state, country, postalCode} = req.body;

    const address = await DeliveryAddress.findOneAndUpdate(
        {_id: req.params.id, user: req.user.id},
        {street, lga, state, country, postalCode},
        {new: true, runValidators: true}
    );

    if (!address) {
        return next(new AppError("Address not found", 404));
    }

    res.status(200).json({
        status: "success",
        data: address,
    });
});

// 🚀 Delete an address
exports.deleteAddress = catchAsync(async (req, res, next) => {
    const address = await DeliveryAddress.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id,
    });

    if (!address) {
        return next(new AppError("Address not found", 404));
    }

    // If the deleted address was default, set another one as default
    if (address.isDefault) {
        const anotherAddress = await DeliveryAddress.findOne({
            user: req.user.id,
        });
        if (anotherAddress) {
            anotherAddress.isDefault = true;
            await anotherAddress.save();
        }
    }

    res.status(200).json({
        status: "success",
        message: "Address deleted successfully",
    });
});

// 🚀 Set an address as default
exports.setDefaultAddress = catchAsync(async (req, res, next) => {
    const {id} = req.params;
    const userId = req.user.id;

    const address = await DeliveryAddress.findOne({_id: id, user: userId});

    if (!address) {
        return next(new AppError("Address not found", 404));
    }

    // Set all other addresses to `isDefault: false`
    await DeliveryAddress.updateMany({user: userId}, {isDefault: false});

    // Set selected address to default
    address.isDefault = true;
    await address.save();

    res.status(200).json({
        status: "success",
        message: "Default address updated successfully",
        data: address,
    });
});
