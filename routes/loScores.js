// routes/loScores.js
import express from "express";
import db from "../db/db.js"; 

const router = express.Router();
router.get("/", async (req, res) => {
    try {
        const { student_id, lo_id } = req.headers;
        if (!student_id) {
            return res.status(400).json({
                error: "student_id header is required.",
            });
        }

        let query = `SELECT ls.student_id, ls.lo_id, ls.value FROM lo_scores ls WHERE ls.student_id = ?`;
        let queryParams = [student_id];

        if (lo_id) {
            query += " AND ls.lo_id = ?";
            queryParams.push(lo_id);
        }

        const [loScores] = await db.query(query, queryParams);
        if (loScores.length === 0) {
            return res.status(404).json({
                error: "No lo_scores found for the provided student_id.",
            });
        }
        
        res.status(200).json({
            lo_scores: loScores,
        });
    } catch (error) {
        console.error("Error fetching lo_scores:", error.message);
        res.status(500).json({
            error: "Internal Server Error",
        });
    }
});

export default router; // Export the router
