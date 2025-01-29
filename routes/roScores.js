// routes/roScores.js
import express from "express";
import db from "../db/db.js"; 
const router = express.Router();

// GET api to fetch report outcome scores
router.get("/", async (req, res) => {
    try {
        const { student_id } = req.headers;
        if (!student_id) {
            return res.status(400).json({
                error: "student_id header is required.",
            });
        }
        const [roScores] = await db.query(
            `SELECT rs.student_id, rs.ro_id, rs.value
            FROM ro_scores rs
            WHERE rs.student_id = ?`,
            [student_id]
        );
        if (roScores.length === 0) {
            return res.status(404).json({
                error: "No ro_scores found for the provided student_id.",
            });
        }
        res.status(200).json({
            ro_scores: roScores,
        });
    } catch (error) {
        console.error("Error fetching ro_scores:", error.message);
        res.status(500).json({
            error: "Internal Server Error",
        });
    }
});

export default router; 
