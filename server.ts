import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import sgMail from "@sendgrid/mail";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  app.use(cors());

  // Set SendGrid API Key
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  // Initialize Razorpay (with dummy support for development)
  const getRazorpay = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!key_id || !key_secret) {
      console.warn("RAZORPAY keys are missing, using mock order for testing.");
      return null;
    }
    return new Razorpay({ key_id, key_secret });
  };

  // API: Create Razorpay Order
  app.post("/api/create-razorpay-order", async (req, res) => {
    try {
      const { amount, currency, receipt, notes } = req.body;
      const razorpay = getRazorpay();

      if (!razorpay) {
        // Return a mock order if no keys
        return res.json({
          id: `order_mock_${Math.random().toString(36).substr(2, 9)}`,
          amount: Math.round(amount * 100),
          currency: currency || "INR",
          receipt: receipt || "mock_receipt",
          status: "created"
        });
      }

      const options = {
        amount: Math.round(amount * 100), // paise for INR
        currency: currency || "INR",
        receipt: receipt || `receipt_${Date.now()}`,
        notes: notes || {}
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error: any) {
      console.error("Razorpay error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API: Send Invoice Email via SendGrid
  app.post("/api/send-invoice", async (req, res) => {
    try {
      const { email, orderId, items, total } = req.body;
      
      if (!process.env.SENDGRID_API_KEY) {
        console.warn("SENDGRID_API_KEY missing, skipping email.");
        return res.json({ success: true, warning: "Email skipped" });
      }

      const msg = {
        to: email,
        from: "HarvestHub <no-reply@harvesthub.in>",
        subject: `Invoice for Order #${orderId}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h1 style="color: #059669;">Thank you for your purchase!</h1>
            <p>Order ID: <b>${orderId}</b></p>
            <hr />
            <ul style="list-style: none; padding: 0;">
              ${items.map((item: any) => `
                <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
                  ${item.name} x ${item.quantity} - <b>₹${item.price * item.quantity}</b>
                </li>`).join("")}
            </ul>
            <div style="margin-top: 20px; font-size: 1.2em; font-weight: bold;">
              Total: <b>₹${total}</b>
            </div>
            <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
              Your fresh produce is being prepared for delivery by our farmers!
            </p>
          </div>
        `,
      };

      await sgMail.send(msg);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Email error:", error);
      res.json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
