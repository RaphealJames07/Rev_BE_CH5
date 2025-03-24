// const nodemailer = require('nodemailer');

// const sendEmail = async (options) => {
//   // 1) Create a transorter
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//     // Activate in gmail "less secure app" option
//   });

//   // 2) Define the email options
//   const mailOptions = {
//     from: 'Rapheal James <testing@james.io>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     //html:
//   };

//   // 3) Send the email
//   await transporter.sendMail(mailOptions);
// };
// module.exports = sendEmail;
const dotenv = require("dotenv");

dotenv.config({path: "./config.env"});

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
});

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient's email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email body (HTML)
 */
const sendEmail = async (options) => {
    // console.log(transporter);
    const mailOptions = {
        from: `"Rapheal Ukachukwu" <${process.env.EMAIL_USERNAME}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
