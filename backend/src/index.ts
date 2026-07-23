import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

import sessionRoutes from "./routes/sessionRoutes";
import authRoutes from "./routes/authRoutes";
import equipmentRoutes from "./routes/equipmentRoutes";
import adminRoutes from "./routes/adminRoutes";
import feedbackRoutes from "./routes/feedbackRoutes";
import goalRoutes from "./routes/goalRoutes";

// Routes
app.use("/api/sessions", sessionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/goals", goalRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5001;

// Connect to MongoDB, then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
