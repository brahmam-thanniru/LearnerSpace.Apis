import "reflect-metadata";
import express from "express";
import cookieParser from "cookie-parser";
import { onRequest } from "firebase-functions/v2/https";

import {
  WEB_API_KEY,
  DB_Url,
  JWT_SECRET,
  DB_PROD,
  OPENAI_API_KEY,
} from "./secrets";

import connectMongo from "./Connect/connect.mongoDb";

// ROUTES
import companyRoutes from "./Users/Company/Company.Route";
import course from "./Users/Company/Courses/Course.Route";
import learner from "./Users/Learner/Learner.Route";
import auth from "./Auth/Auth.Route";
import lead from "./Users/Company/Leads/Lead.Route";
import adminLead from "./Users/Admin/Lead/AdminLead.Route";
import utils from "./Users/Utils/Util.Route";
import posts from "./Users/Posts/Posts.Route";
import likes from "./Users/Likes/Likes.Route";
import comments from "./Users/Comments/Comments.Route";
import outcomes from "./Users/Outcomes/Outcome.Route";
import {
  categoryRouter,
  CourseCategoryRouter,
} from "./Users/Admin/Category/Category.Route";
import { CounselorRouter } from "./Users/CompanyStaff/Counselor/Counselor.Router";
import { ProgramManagerRoute } from "./Users/CompanyStaff/ProgramManager/ProgramManager.Route";
import { AdminInternRouter } from "./Users/Admin/AdminIntern/AdminIntern.Route";

const app = express();

/* --------------------------------------------------------------
   0️⃣ STRIP /API PREFIX FOR FIREBASE REWRITES
-------------------------------------------------------------- */
app.use((req, res, next) => {
  if (req.url.startsWith("/api")) {
    req.url = req.url.replace(/^\/api/, "") || "/";
  }
  next();
});

/* --------------------------------------------------------------
   1️⃣ FIREBASE GEN-2 CORS FIX — MUST BE FIRST
-------------------------------------------------------------- */
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", req.headers.origin || "");
  res.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Credentials", "true");

  // Fix duplicate headers for OPTIONS
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  next();
});

/* --------------------------------------------------------------
   2️⃣ BODY PARSER — DO NOT PARSE MULTIPART UPLOADS
-------------------------------------------------------------- */
app.use((req, res, next) => {
  // Use 'includes' to be safer in case of query params or sub-paths
  if (req.url.includes("/utils/upload")) {
    return next();
  }

  // Parse JSON for all other routes
  express.json()(req, res, next);
});

app.use(cookieParser());

/* --------------------------------------------------------------
   3️⃣ DATABASE INITIALIZATION (Lazy Connect)
-------------------------------------------------------------- */
let isMongoConnected = false;


/* --------------------------------------------------------------
   4️⃣ ROUTES — UPLOAD ROUTE FIRST
-------------------------------------------------------------- */
app.use("/utils", utils);
app.use("/auth", auth);
app.use("/company", companyRoutes);
app.use("/learners", learner);
app.use("/courses", course);
app.use("/leads", lead);
app.use("/admin/leads", adminLead);
app.use("/categories", categoryRouter);
app.use("/courseCategory", CourseCategoryRouter);
app.use("/posts", posts);
app.use("/likes", likes);
app.use("/comments", comments);
app.use("/Counselor", CounselorRouter);
app.use("/ProgramManager", ProgramManagerRoute);
app.use("/outcomes", outcomes);
app.use("/admin-interns", AdminInternRouter);

app.get("/", (req, res) => {
  res.send("Server is running");
});



/* --------------------------------------------------------------
   5️⃣ FIREBASE GEN-2 EXPORTS
-------------------------------------------------------------- */
export const api = onRequest(
  {
    secrets: [WEB_API_KEY, JWT_SECRET, DB_Url, DB_PROD, OPENAI_API_KEY],
    minInstances: 0,
    timeoutSeconds: 120, // Increase this
    memory: "512MiB",
  },
  async (req, res) => {
    if (!isMongoConnected) {
      try {
        console.log("Attempting MongoDB connection for Production...");
        await connectMongo(DB_PROD.value());
        isMongoConnected = true;
        console.log("✅ MongoDB connected successfully for Production");
      } catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        res.status(503).send("Service Unavailable: Database initialization failed.");
        return;
      }
    }
    app(req, res);
  }
);

export const apiUat = onRequest(
  {
    secrets: [WEB_API_KEY, JWT_SECRET, DB_Url, DB_PROD, OPENAI_API_KEY],
    minInstances: 0,
    timeoutSeconds: 120, // Increase this
    memory: "512MiB",
  },
  async (req, res) => {
    if (!isMongoConnected) {
      try {
        console.log("Attempting MongoDB connection for UAT...");
        await connectMongo(DB_Url.value());
        isMongoConnected = true;
        console.log("✅ MongoDB connected successfully for UAT");
      } catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        res.status(503).send("Service Unavailable: Database initialization failed.");
        return;
      }
    }
    app(req, res);
  }
);

export { WEB_API_KEY };
