import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/reorder", async (req, res) => {
    const { itemName, supplierEmail } = req.body;
    console.log(`[Reorder Triggered] Sending email to ${supplierEmail} for ${itemName}`);
    // Simulate email sending
    res.json({ message: `Reorder email sent to ${supplierEmail} for ${itemName}` });
  });

  app.post("/api/suggest-reorder", async (req, res) => {
    const { item } = req.body;
    
    // Simulate AI logic based on dailyUsageRate and some trend
    // In a real app, this would use the Gemini API
    const trendFactor = 1.2; // Assume a 20% growth trend
    const suggestedQuantity = Math.ceil(item.dailyUsageRate * 30 * trendFactor); // Suggest 30 days of stock

    res.json({ suggestedQuantity });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
