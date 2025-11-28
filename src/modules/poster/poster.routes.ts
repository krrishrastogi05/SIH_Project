import { Router } from "express";
import { PosterController } from "./poster.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleCheck } from "../../middlewares/roles.js";

const router = Router();

// Public create poster (if you want posters to register themselves)
router.post("/", (req, res) => PosterController.createPoster(req, res));

// Poster-only actions
router.use(authMiddleware);
router.use(roleCheck(["POSTER"]));

router.post("/schemes", (req, res) => PosterController.createScheme(req, res));
router.get("/schemes/my", (req, res) => PosterController.mySchemes(req, res));

// Public fetch poster info
router.get("/:id", (req, res) => PosterController.getPoster(req, res));

export default router;
