import { Router } from "express";
import {
  create,
  list,
  getById,
  update,
  remove,
  stats,
} from "../controllers/project.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// All project routes require authentication
router.use(authenticate);

router.get("/stats", stats);
router.route("/").get(list).post(create);
router.route("/:id").get(getById).patch(update).delete(remove);

export default router;