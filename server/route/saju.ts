import { Router } from "express";
import { calculateSaju } from "../saju-api";

const router = Router();

router.post("/saju", (req, res) => {
  const { birthDate, birthTime } = req.body;

  try {
    const result = calculateSaju({ birthDate, birthTime });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: "Invalid input", detail: e.toString() });
  }
});

export default router;
