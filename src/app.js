import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.get('/', (req, res) => {
  res.send('Welcome to my project!');
});


//middlewares/basic configuration
app.use(express.json({limit: "16kb"}));// i want to parse the json data coming from the client
app.use(express.urlencoded({extended: true, limit:"16kb"})); // i want to parse the urlencoded data coming from the client
app.use(express.static("public")); // i want to serve the static files from the public folder
app.use(cookieParser()); // i want to parse the cookies coming from the client


//cors configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || "*", // allow all origins if not defined
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // allow all methods
  allowedHeaders: ["Content-Type", "Authorization"], // allow all headers
  credentials: true, // allow cookies
}));



//importing the routes always after the configuartion 
import healthCheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";

app.use('/api/v1/healthCheck', healthCheckRouter);//prefix in the url for healthcheck routes
app.use('/api/v1/auth', authRouter);//prefix in the url for auth routes

// Global Error Handler Middleware (MUST have 4 arguments for Express to recognize it as an error handler)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const errors = err.errors || [];

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});


export default app;