import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { fileURLToPath } from 'url'

import authRoute from "./routes/auth.route.js";
import connectDB from "./config/database.js";
dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

// middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || [ 'http://localhost:5173', 'http://localhost:5174' ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use("/api/auth", authRoute);
app.listen(PORT, () => {
  console.log(`server running on port: ${PORT}`);
  connectDB()
});
