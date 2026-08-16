import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import patientRoutes from "./routes/patient.routes.js";
import cardRoutes from "./routes/card.routes.js";

import "./config/env.js";

const app = express();

//
// Security
//
app.use(helmet());

//
// CORS
//
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

//
// Request logging
//
app.use(morgan("dev"));

//
// Body parsing
//
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

//
// Basic rate limiting
//
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

app.use("/api", limiter);

//
// Health check
//
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MedCard API is running",
    timestamp: new Date().toISOString()
  });
});


//
// routes
//
app.use("/api/v1/patients", patientRoutes);
app.use("/api/v1/cards", cardRoutes);

//
// 404
//
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

//
// Error handler
//
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message
  });
});

export default app;