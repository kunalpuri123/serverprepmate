const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000; // Provide a default port

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors());

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "http://localhost:3000"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Content-Type-Options, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Private-Network", true);
  //  Firefox caps this at 24 hours (86400 seconds). Chromium (starting in v76) caps at 2 hours (7200 seconds). The default value is 5 seconds.
  res.setHeader("Access-Control-Max-Age", 7200);

  next();
});

const razorpay = new Razorpay({ // Initialize Razorpay outside the route handler
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

app.post("/order", async (req, res) => {
  try {
    const options = req.body;
    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ error: "Failed to create order" }); // Send JSON error
    }

    res.json(order); // Send the complete order object
  } catch (err) {
    console.error("Error creating order:", err); // Log the actual error
    res.status(500).json({ error: "Failed to create order" }); // Send JSON error
  }
});

app.post("/order/validate", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const body = String(razorpay_order_id).trim() + "|" + String(razorpay_payment_id).trim();

  console.log("Backend String for Hash:", body); // Log the string
  console.log("Received Signature:", razorpay_signature); // Log the received signature

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");
 
  alert("Generated Signature:", expectedSignature);

  if (expectedSignature === razorpay_signature) {
    res.json({ success: true, message: "Payment verified" }); // Consistent success key
  } else {
    res.status(400).json({ success: false, message: "Invalid signature" }); // Consistent failure key
  }
});


app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
