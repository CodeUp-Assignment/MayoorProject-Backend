// routes/roLoMapping.js
import express from "express";
import db from "../db/db.js"; 
const router = express.Router();
const priorityValues = {
    h: 0.5,
    m: 0.3,
    l: 0.2,
};

// POST api to map report outcomes to learning outcomes
router.post("/", async (req, res) => {
    try {
        const subject = req.headers["subject"];
        const quarter = req.headers["quarter"];
        const year = req.headers["year"];
        const className = req.headers["class"];
        const section = req.headers["section"];

        const { ro_id, data } = req.body;
        if (!data || !Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ error: "Invalid data format. Expected an array of objects with lo_id and priority." });
        }
        
        const validPriorities = ["h", "m", "l"];
        for (const item of data) {
            if (!validPriorities.includes(item.priority)) {
                return res.status(400).json({ error: `Invalid priority '${item.priority}'. Must be 'h', 'm', or 'l'.` });
            }
        }

        const [roRows] = await db.query("SELECT id FROM report_outcomes WHERE id = ?", [ro_id]);
        if (roRows.length === 0) {
            return res.status(404).json({ error: "Invalid ro_id provided." });
        }

        const [studentRows] = await db.query(
            `SELECT student_id FROM students_records WHERE year = ? AND class = ? AND section = ?`,
            [year, className, section]
        );
        if (studentRows.length === 0) {
            return res.status(404).json({ error: "No students found in students_records for the given filters." });
        }
        const studentIds = studentRows.map(row => row.student_id);
        const inputLoIds = data.map(item => item.lo_id);
        const [validLoRows] = await db.query(
            "SELECT id AS lo_id FROM learning_outcomes WHERE id IN (?) AND subject = ? AND quarter = ?",
            [inputLoIds, subject, quarter]
        );
        const validLoIds = validLoRows.map(row => row.lo_id);
        if (validLoIds.length !== inputLoIds.length) {
            return res.status(404).json({ error: "Some provided lo_ids are invalid or do not match filters." });
        }
        let totalDenominator = 0;
        data.forEach(item => {
            totalDenominator += priorityValues[item.priority];
        });
        if (totalDenominator === 0) {
            return res.status(400).json({ error: "Invalid weight calculation, check input values." });
        }

        const roLoMappingPromises = data.map(async (item) => {
            const { lo_id, priority } = item;
            let weight = priorityValues[priority] / totalDenominator;
            await db.query(
                "INSERT INTO ro_lo_mapping (ro_id, lo_id, weight) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE weight = ?",
                [ro_id, lo_id, weight, weight]
            );
            return { lo_id, weight };
        });

        const mappings = await Promise.all(roLoMappingPromises);
        for (const student_id of studentIds) {
            let roScore = 0;
            for (const mapping of mappings) {
                const { lo_id, weight } = mapping;
                const [loScoreRows] = await db.query(
                    "SELECT value FROM lo_scores WHERE lo_id = ? AND student_id = ?",
                    [lo_id, student_id]);
                if (loScoreRows.length === 0) {
                    console.warn(`Missing lo_scores for lo_id: ${lo_id}, student_id: ${student_id}`);
                    continue;
                }
                const { value } = loScoreRows[0];
                roScore += weight * value;
            }
            await db.query(
                "INSERT INTO ro_scores (ro_id, student_id, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?",
                [ro_id, student_id, roScore, roScore]
            );
        }

        res.status(201).json({
            message: "RO and LO mapping with weights saved successfully",
            students_processed: studentIds.length,
        });
    } catch (error) {
        console.error("Error mapping RO and LO:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router; 
