import { Router } from "express";
import {
  getAllNetworks,
  createNetworkHandler,
  startNetworkHandler,
  stopNetworkHandler,
  removeNetworkHandler,
  getNetworkStatusHandler,
} from "../controllers/networksController";
import {
  addNodeHandler,
  startNodeHandler,
  stopNodeHandler,
  removeNodeHandler,
} from "../controllers/nodesController";

const router = Router();

// Rutas para la gestión de redes
router.get("/", getAllNetworks);
router.post("/create", createNetworkHandler);
router.post("/start", startNetworkHandler);
router.post("/stop", stopNetworkHandler);
router.post("/remove", removeNetworkHandler);
router.get("/:networkName/status", getNetworkStatusHandler);

// Rutas para la gestión de nodos
router.post("/:networkName/nodes/add", addNodeHandler);
router.post("/:networkName/nodes/start", startNodeHandler);
router.post("/:networkName/nodes/stop", stopNodeHandler);
router.post("/:networkName/nodes/remove", removeNodeHandler);

export default router;
