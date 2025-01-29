// routes/loAcMapping.js
import express from "express";
import db from "../db/db.js"; // Adjust the path as necessary

const router = express.Router();

const priorityValues = {
    h: 0.5,
    m: 0.3,
    l: 0.2,
};

// POST route to map learning outcomes to assessment criteria
router.post("/", async (req, res) => {
    try {
        // Extract headers
        const subject = req.headers["subject"];
        const quarter = req.headers["quarter"];
        const year = req.headers["year"];
        const className = req.headers["class"];
        const section = req.headers["section"];

        // Extract and validate data from the request body
        const { lo_id, data } = req.body;

        if (!data || !Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ error: "Invalid data format. Expected an array of objects with ac_id and priority." });
        }

        // Validate priority values
        const validPriorities = ["h", "m", "l"];
        for (const item of data) {
            if (!validPriorities.includes(item.priority)) {
                return res.status(400).json({ error: `Invalid priority '${item.priority}'. Must be 'h', 'm', or 'l'.` });
            }
        }

        // Validate `lo_id`
        const [loRows] = await db.query(`SELECT id FROM learning_outcomes WHERE id = ?`, [lo_id]);
        if (loRows.length === 0) {
            return res.status(404).json({ error: "Invalid lo_id provided." });
        }

        // Fetch student IDs from `students_records`
        const [studentRows] = await db.query(
            `SELECT student_id FROM students_records WHERE year = ? AND class = ? AND section = ?`,
            [year, className, section]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ error: "No students found in students_records for the given filters." });
        }

        const studentIds = studentRows.map(row => row.student_id);

        // Extract ac_ids from the request data
        const inputAcIds = data.map(item => item.ac_id);

        // Validate provided ac_ids
        const [validAcRows] = await db.query(
            `SELECT id AS ac_id FROM assessment_criterias WHERE id IN (?) AND subject = ? AND quarter = ?`,
            [inputAcIds, subject, quarter]
        );

        const validAcIds = validAcRows.map(row => row.ac_id);
        if (validAcIds.length !== inputAcIds.length) {
            return res.status(404).json({ error: "Some provided ac_ids are invalid or do not match filters." });
        }

        // Calculate total denominator for weights
        let totalDenominator = 0;
        data.forEach(item => {
            totalDenominator += priorityValues[item.priority];
        });
        if (totalDenominator === 0) {
            return res.status(400).json({ error: "Invalid weight calculation, check input values." });
        }

        // Insert weights into `lo_ac_mapping`
        const loAcMappingPromises = data.map(async (item) => {
            const { ac_id, priority } = item;
            let weight = priorityValues[priority] / totalDenominator;
            await db.query(
                "INSERT INTO lo_ac_mapping (lo_id, ac_id, weight) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE weight = ?",
                [lo_id, ac_id, weight, weight]
            );
            return { ac_id, weight };
        });

        // Resolve all weight calculations
        const mappings = await Promise.all(loAcMappingPromises);

        // Process lo_scores for each student
        for (const student_id of studentIds) {
            let loScore = 0;
            for (const mapping of mappings) {
                const { ac_id, weight } = mapping;
                // Fetch `value` from `ac_scores`
                const [acScoreRows] = await db.query(
                    "SELECT value FROM ac_scores WHERE ac_id = ? AND student_id = ?",
                    [ac_id, student_id]
                );
                if (acScoreRows.length === 0) {
                    console.warn(`Missing ac_scores for ac_id: ${ac_id}, student_id: ${student_id}`);
                    continue;
                }
                const { value } = acScoreRows[0];
                loScore += weight * value;
            }
            // Insert or update `lo_scores`
            await db.query(
                "INSERT INTO lo_scores (lo_id, student_id, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?",
                [lo_id, student_id, loScore, loScore]
            );
        }

        res.status(201).json({
            message: "LO and AC mapping with weights saved successfully",
            students_processed: studentIds.length,
        });
    } catch (error) {
        console.error("Error mapping LO and AC:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router; // Export the router