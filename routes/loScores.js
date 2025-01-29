// routes/loScores.js
import express from "express";
import db from "../db/db.js"; // Adjust the path as necessary

const router = express.Router();

// GET route to fetch learning outcome scores
router.get("/", async (req, res) => {
    try {
        // Extract student_id and lo_id from headers
        const { student_id, lo_id } = req.headers;

        // Validation check for student_id
        if (!student_id) {
            return res.status(400).json({
                error: "student_id header is required.",
            });
        }

        let query = `SELECT ls.student_id, ls.lo_id, ls.value FROM lo_scores ls WHERE ls.student_id = ?`;
        let queryParams = [student_id];

        // If lo_id is provided, filter results by lo_id
        if (lo_id) {
            query += " AND ls.lo_id = ?";
            queryParams.push(lo_id);
        }

        // Fetch lo_scores based on student_id (and optional lo_id)
        const [loScores] = await db.query(query, queryParams);

        if (loScores.length === 0) {
            return res.status(404).json({
                error: "No lo_scores found for the provided student_id.",
            });
        }

        // Send the response with lo_scores data
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