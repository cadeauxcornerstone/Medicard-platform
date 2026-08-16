import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import patientRoutes from "./routes/patient.routes.js";
import cardRoutes from "./routes/card.routes.js";
import clinicalNoteRoutes from "./routes/clinical-note.routes.js";
import diagnosisRoutes from "./routes/diagnosis.routes.js";
import prescriptionRoutes from "./routes/prescription.routes.js";
import labRequestRoutes from "./routes/lab-request.routes.js";
import labResultRoutes from "./routes/lab-result.routes.js";
import radiologyRequestRoutes from "./routes/radiology-request.routes.js";
import radiologyStudyRoutes from "./routes/radiology-study.routes.js";
import radiologyReportRoutes from "./routes/radiology-report.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import "./config/env.js";
import servicePriceRoutes from "./routes/service-price.routes.js";
import chargeRoutes from "./routes/charge.routes.js";
import insuranceRoutes from "./routes/insurance.routes.js";

const app = express();

/*
|--------------------------------------------------------------------------
| SECURITY
|--------------------------------------------------------------------------
*/

app.use(helmet());

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

/*
|--------------------------------------------------------------------------
| REQUEST LOGGING
|--------------------------------------------------------------------------
*/

app.use(morgan("dev"));

/*
|--------------------------------------------------------------------------
| BODY PARSING
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

/*
|--------------------------------------------------------------------------
| RATE LIMITING
|--------------------------------------------------------------------------
*/

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

app.use("/api", limiter);

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MedCard API is running",
    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| PATIENT ROUTES
|--------------------------------------------------------------------------
*/

app.use(
  "/api/v1/patients",
  patientRoutes
);

/*
|--------------------------------------------------------------------------
| CARD / NFC ROUTES
|--------------------------------------------------------------------------
*/

app.use(
  "/api/v1/cards",
  cardRoutes
);

/*
|--------------------------------------------------------------------------
| CLINICAL NOTE ROUTES
|--------------------------------------------------------------------------
|
| POST
| /api/v1/encounters/:encounterId/clinical-notes
|
*/

app.use(
  "/api/v1",
  clinicalNoteRoutes
);

/*
|--------------------------------------------------------------------------
| DIAGNOSIS ROUTES
|--------------------------------------------------------------------------
|
| POST
| /api/v1/encounters/:encounterId/diagnoses
|
*/

app.use(
  "/api/v1",
  diagnosisRoutes
);

/*
|--------------------------------------------------------------------------
| PRESCRIPTION ROUTES
|--------------------------------------------------------------------------
|
| POST
| /api/v1/encounters/:encounterId/prescriptions
|
*/

app.use(
  "/api/v1",
  prescriptionRoutes
);

/*
|--------------------------------------------------------------------------
| LABORATORY REQUEST ROUTES
|--------------------------------------------------------------------------
|
| POST
| /api/v1/encounters/:encounterId/lab-requests
|
*/

app.use(
  "/api/v1",
  labRequestRoutes
);


app.use("/api/v1", labResultRoutes);

app.use("/api/v1", radiologyRequestRoutes);
app.use("/api/v1", radiologyStudyRoutes);
app.use(
  "/api/v1",
  radiologyReportRoutes
);
app.use(
  "/api/v1",
  departmentRoutes
);

app.use(
  "/api/v1",
  serviceRoutes
);
app.use(
  "/api/v1",
  servicePriceRoutes
);

app.use(
  "/api/v1",
  chargeRoutes
);

app.use(
  "/api/v1",
  insuranceRoutes
);



/*
|--------------------------------------------------------------------------
| 404 — ROUTE NOT FOUND
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/*
|--------------------------------------------------------------------------
| GLOBAL ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,

    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

export default app;