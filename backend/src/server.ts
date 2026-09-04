import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();
const PORT = env.PORT;

app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get(
  "/api/health",
  (_request: Request, response: Response) => {
    response.status(200).json({
      success: true,
      message: "TeamPulse API is running",
      timestamp: new Date().toISOString(),
    });
  },
);

// Authentication endpoints
app.use("/api/auth", authRoutes);

// This must remain after all valid routes
app.use((_request: Request, response: Response) => {
  response.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Global error handler must remain last
app.use(
  (
    error: Error,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    console.error(error);

    response.status(500).json({
      success: false,
      message: "Internal server error",
    });
  },
);

app.listen(PORT, () => {
  console.log(
    `TeamPulse API running at http://localhost:${PORT}`,
  );
});