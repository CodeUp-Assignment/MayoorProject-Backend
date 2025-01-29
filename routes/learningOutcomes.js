// routes/learningOutcomes.js
import express from "express";
import db from "../db/db.js";

const router = express.Router();

// POST api to add a new learning outcome
router.post("/", async (req, res) => {
    const { year, quarter, subject } = req.headers;
    const { name } = req.body;

    if (!year || !quarter || !subject || !name) {
        return res.status(400).json({
            message: "Missing required fields: year, quarter, subject (headers) or name (body).",
        });
    }
    try {
        const [maxIdRow] = await db.execute('SELECT MAX(id) AS maxId FROM learning_outcomes');
        const newId = (maxIdRow[0].maxId || 0) + 1;

        const query = `
            INSERT INTO learning_outcomes (id, name, year, quarter, subject) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [newId, name, year, quarter, subject]);

        res.status(201).json({
            message: "Learning outcome added successfully",
            insertedId: newId,
        });
    } catch (err) {
        console.error("Error inserting learning outcome:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET api to fetch learning outcomes
router.get("/", async (req, res) => {
    const { year, subject, quarter } = req.headers;

    if (!year || !subject || !quarter) {
        return res.status(400).json({ message: "Missing required headers: year, subject, or quarter" });
    }
    try {
        const query = `
            SELECT id, name 
            FROM learning_outcomes 
            WHERE year = ? AND subject = ? AND quarter = ?`;
        const [results] = await db.execute(query, [year, subject, quarter]);
        if (results.length === 0) {
            return res.status(404).json({ message: "No learning outcomes found for the provided filters" });
        }
        res.status(200).json(results);
    } catch (err) {
        console.error("Error fetching learning outcomes:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router; 
