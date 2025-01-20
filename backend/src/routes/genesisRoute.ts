import { Router } from "express";
import {
  createGenesisFile,
  getGenesisConfig,
} from "../controllers/genesisController";

const router = Router();

router.post("/", createGenesisFile);
router.get("/:networkName", getGenesisConfig);

export default router;
