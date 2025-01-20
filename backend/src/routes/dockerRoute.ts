import { Router } from "express";
import {
  createDockerCompose,
  getDockerLogs,
} from "../controllers/dockerController";

const router = Router();

router.post("/:networkName", createDockerCompose);
router.get("/:networkName/:nodeIndex/logs", getDockerLogs);

export default router;
