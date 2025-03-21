const fs = require("fs");
const Product = require("../models/productModel");
const cloudinary = require("../utils/cloudinary");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

exports.createProduct = catchAsync(async (req, res, next) => {
    const {
        productName,
        stockQuantity,
        basePrice,
        category,
        brand,
        type,
        variants, // Expecting this as a JSON string
        shortDescription,
        fullDescription,
        weight,
        sku,
    } = req.body;

    // Validate required fields
    if (
        !productName ||
        !category ||
        !brand ||
        !shortDescription ||
        !fullDescription ||
        !weight ||
        !sku
    ) {
        return next(new AppError("Missing required fields", 400));
    }

    // Parse and validate sizes field (JSON string)
    let sizes = [];
    try {
        sizes = JSON.parse(req.body.sizes);
    } catch (err) {
        return next(new AppError("Invalid sizes format", 400));
    }
    if (!Array.isArray(sizes) || sizes.length < 2) {
        return next(new AppError("Please provide at least two sizes", 400));
    }

    // Parse and validate variants field (JSON string)
    let parsedVariants = [];
    if (variants) {
        try {
            parsedVariants = JSON.parse(variants);
        } catch (err) {
            return next(new AppError("Invalid variants format", 400));
        }
    }

    // Validate images
    if (!req.files || req.files.length === 0) {
        return next(new AppError("No image files provided", 400));
    }

    // Upload all images to Cloudinary
    const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path, {
            folder: "cohort_5_images_revision",
            use_filename: true,
        })
    );
    const uploadResults = await Promise.all(uploadPromises);

    // Extract secure URLs from the results
    const imageUrls = uploadResults.map((result) => result.secure_url);

    // Remove the temporary files from the server
    req.files.forEach((file) => {
        fs.unlink(file.path, (err) => {
            if (err) {
                console.error(`Error deleting file: ${file.path}`);
            }
        });
    });

    // Create the product
    const product = new Product({
        productName,
        stockQuantity,
        basePrice,
        images: imageUrls,
        sizes,
        category,
        brand,
        type,
        variants: parsedVariants,
        shortDescription,
        fullDescription,
        weight,
        sku,
    });

    // Save to database
    const createdProduct = await product.save();

    // Respond to the client
    res.status(201).json({
        status: "success",
        data: {
            product: createdProduct,
        },
    });
});

exports.getProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(
            new AppError(`product with ID: ${req.params.id} not found`, 404)
        );
    }
    res.status(200).json({
        status: "success",
        data: {
            product,
        },
    });
});
exports.getAllProducts = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Product.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const products = await features.query;
    res.status(200).json({
        status: "success",
        result: products.length,
        data: {
            products,
        },
    });
});
exports.updateProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!product) {
        return next(new AppError(`Product with ID: ${req.params.id} not found`, 404));
      }
      res.status(200).json({
        status: 'success',
        data: {
          product,
        },
      });
});
exports.deleteProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return next(new AppError(`Product with ID: ${req.params.id} not found`, 404));
  }
  res.status(204).json({
    status: 'success',
  });
});
