import express from "express";
import db from "../db/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const year = req.headers["year"];
    const subject = req.headers["subject"];

    if (!year || !subject) {
        return res.status(400).json({
            message: "Missing required headers. Please provide 'year' and 'subject'.",
        });
    }

    if (isNaN(year) || !subject.trim()) {
        return res.status(400).json({
            message: "Invalid header values. 'year' should be a number, and 'subject' cannot be empty.",
        });
    }

    try {
        const query = `
    SELECT id, name 
    FROM report_outcomes 
    WHERE year = ? AND subject = ?
    `;
        const [results] = await db.execute(query, [year, subject]);

        if (results.length === 0) {
            return res.status(404).json({ message: "No report outcomes found for the given year and subject." });
        }

        res.status(200).json({ ro: results });
    } catch (err) {
        console.error("Error fetching report outcomes:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;