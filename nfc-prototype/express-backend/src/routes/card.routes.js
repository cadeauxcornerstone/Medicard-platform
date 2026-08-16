import express from "express";

import {
  create,
  getByUid,
  identify,
  block,
  unblock,
} from "../controllers/card.controller.js";

const router = express.Router();

router.post("/", create);

router.post("/identify", identify);

router.get("/:cardUid", getByUid);

router.post("/:cardUid/block", block);

router.post("/:cardUid/unblock", unblock);

export default router;