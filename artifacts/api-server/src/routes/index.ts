import { Router, type IRouter } from "express";
import healthRouter from "./health";
import desksRouter from "./desks";
import librarianRouter from "./librarian";
import analyticsRouter from "./analytics";
import demoRouter from "./demo";

const router: IRouter = Router();

router.use(healthRouter);
router.use(desksRouter);
router.use(librarianRouter);
router.use(analyticsRouter);
router.use(demoRouter);

export default router;
