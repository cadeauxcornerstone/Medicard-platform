import express from "express";

import {
  create,
  getAll,
  getById,
  update,
  deactivate,
} from "../controllers/department.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Departments
|--------------------------------------------------------------------------
*/

router.post(
  "/departments",
  create
);

router.get(
  "/departments",
  getAll
);

router.get(
  "/departments/:departmentId",
  getById
);

router.patch(
  "/departments/:departmentId",
  update
);

router.patch(
  "/departments/:departmentId/deactivate",
  deactivate
);

export default router;