import { Router } from "express";
import authRoutes from "./auth.routes.js";
import projectRoutes from "./project.routes.js";
import aiRoutes from "./ai.routes.js";
import logsRoutes from "./logs.routes.js";
import safetyRoutes from "./safety.routes.js";
import chatRoutes from "./chat.routes.js";
import subcontractorRoutes from "./subcontractor.routes.js";
import bidRoutes from "./bid.routes.js";
import bidAnalysisRoutes from "./bidAnalysis.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "Construction MVP API is running" });
});

router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/ai", aiRoutes);
router.use("/logs", logsRoutes);
router.use("/safety", safetyRoutes);
router.use("/chat", chatRoutes);
router.use("/subcontractors", subcontractorRoutes);

export default router;