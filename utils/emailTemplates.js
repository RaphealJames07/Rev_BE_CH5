exports.verifyEmailTemplate = (link, firstName) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; background: #f4f4f4; text-align: center; padding: 20px; }
        .container { max-width: 600px; background: #ffffff; padding: 20px; border-radius: 10px; margin: 0 auto; }
        .btn { display: inline-block; padding: 15px 25px; font-size: 18px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; }
        .footer { font-size: 12px; color: #777; margin-top: 20px; }
      </style>
    </head> 
    <body>
      <div class="container">
        <h1>Verify Your Account</h1>
        <p>Hello ${firstName},</p>
        <p>Click the button below to verify your email:</p>
        <a href="${link}" class="btn">Verify Account</a>
        <p>If you didn't request this, ignore this email.</p>
        <div class="footer">© ${new Date().getFullYear()} Your Company</div>
      </div>
    </body>
    </html>
  `;

exports.resetPasswordTemplate = (link, firstName) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; background: #f4f4f4; text-align: center; padding: 20px; }
        .container { max-width: 600px; background: #ffffff; padding: 20px; border-radius: 10px; margin: 0 auto; }
        .btn { display: inline-block; padding: 15px 25px; font-size: 18px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
        .footer { font-size: 12px; color: #777; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Reset Your Password</h1>
        <p>Hello ${firstName},</p>
        <p>Click the button below to reset your password:</p>
        <a href="${link}" class="btn">Reset Password</a>
        <p>If you didn't request this, ignore this email.</p>
        <div class="footer">© ${new Date().getFullYear()} Your Company</div>
      </div>
    </body>
    </html>
  `;

exports.orderConfirmationTemplate = (orderNumber, firstName, items, totalAmount) => {
  // console.log("Email Shii", items)
  const itemsHtml = items.map(item => `<li>${item.productType} - $${item.totalPrice} (Qty: ${item.quantity})</li>`).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; background: #f4f4f4; text-align: center; padding: 20px; }
        .container { max-width: 600px; background: #ffffff; padding: 20px; border-radius: 10px; margin: 0 auto; }
        .footer { font-size: 12px; color: #777; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Order Confirmation</h1>
        <p>Hello ${firstName},</p>
        <p>Thank you for your purchase! Here are your order details:</p>
        <ul>${itemsHtml}</ul>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Total Amount:</strong> $${totalAmount}</p>
        <p>Your order is being processed and will be shipped soon.</p>
        <div class="footer">© ${new Date().getFullYear()} Your Company</div>
      </div>
    </body>
    </html>
  `;
};
