const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const dotenv = require("dotenv");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const userRouter = require("./routes/userRoutes");
const cartsRouter = require("./routes/cartsRoutes");
const orderRouter = require("./routes/orderRoutes");
const addressRouter = require("./routes/deliveryAddressRoute");
const paymentsRouter = require("./routes/paymentsRoutes");
const productRouter = require("./routes/productRoutes");
// const cartRouter = require("./routes/cartRoutes");
// const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
dotenv.config({path: "./config.env"});
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    })
);

app.use(helmet());

app.use(morgan("dev"));

app.use(
    express.json({
        limit: "10kb",
    })
);

app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.headers);
    next();
});

app.get("/", (req, res) => {
    res.send(
        `Welcome to cohort 5 revision server! you are on ${process.env.NODE_ENV} mode`
    );
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/carts", cartsRouter);
app.use("/api/v1/payments", paymentsRouter);
app.use("/api/v1/address", addressRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/product", productRouter);
// app.use("/api/v1/cart", cartRouter);
// app.use("/api/v1/payments", paymentRoutes);

// Handle Unhandled ROutes
app.all("*", (req, res, next) => {
    next(
        new AppError(
            `Can not find ${req.originalUrl} endpoint on this server`,
            404
        )
    );
});

app.use(globalErrorHandler);

module.exports = app;
