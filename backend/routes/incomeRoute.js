import express from "express";
import { addIncome, getAllIncome, updateIncome, deleteIncome, getIncomeOverview, downloadIncomeExcel } from "../controllers/incomeController.js";
import authMiddleware from "../middleware/auth.js";

const incomeRouter = express.Router();

incomeRouter.post("/add", authMiddleware, addIncome);
incomeRouter.get("/get", authMiddleware, getAllIncome);

incomeRouter.put("/update/:id", authMiddleware, updateIncome);
incomeRouter.get("/downloadexcel", authMiddleware, downloadIncomeExcel);

incomeRouter.delete("/delete/:id", authMiddleware, deleteIncome);
incomeRouter.get("/overview", authMiddleware, getIncomeOverview);

export default incomeRouter;