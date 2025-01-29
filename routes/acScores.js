// routes/acScores.js
import express from "express";
import db from "../db/db.js"; // Adjust the path as necessary

const router = express.Router();

// POST route to add or update normalized score
router.post("/", async (req, res) => {
    try {
        // Extracting headers
        const { year, quarter, subject } = req.headers;

        // Extracting obtained marks from the body
        const { obtained_marks, student_id, ac_id } = req.body;

        // Input validation
        if (!obtained_marks) {
            return res.status(400).json({ error: "obtained_marks, student_id and ac_id are required in the body" });
        }
        if (!student_id || !ac_id) {
            return res.status(400).json({ error: "year, quarter, subject are required in the headers" });
        }

        // Fetch the assessment criteria using ac_id
        const [criteriaRows] = await db.query(
            "SELECT max_marks FROM assessment_criterias WHERE id = ? AND subject = ? AND quarter = ? AND year = ?",
            [ac_id, subject, quarter, year]
        );

        // If no matching criteria is found
        if (criteriaRows.length === 0) {
            return res.status(404).json({ error: "Assessment criteria not found for the given parameters" });
        }

        // Fetching max_marks for normalization
        const max_marks = criteriaRows[0].max_marks;

        // Validate that obtained_marks does not exceed max_marks
        if (obtained_marks > max_marks) {
            return res.status(400).json({ error: "Obtained Marks cannot be greater than Maximum marks of the Assessment" });
        }

        // Calculate normalized marks
        const normalized_marks = obtained_marks / max_marks;

        // Insert normalized score into ac_scores table
        const [result] = await db.query(
            "INSERT INTO ac_scores (student_id, ac_id, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?",
            [student_id, ac_id, normalized_marks, normalized_marks]
        );

        // Respond with success message
        res.status(201).json({
            message: "Normalized score saved successfully"
        });
    } catch (error) {
        console.error("Error adding normalized score:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET route to fetch the score
router.get("/", async (req, res) => {
    const { student_id, ac_id } = req.headers; // Extract headers

    console.log(`Fetching score for Student ID: ${student_id}, Assessment Criteria ID: ${ac_id}`);

    // Validate input
    if (!student_id) {
        return res.status(400).json({
            message: 'Invalid input. Student ID (student_id) is required.',
        });
    }

    try {
        // Query to fetch the score
        let query;
        const params = [student_id];

        if (ac_id) {
            // If ac_id is provided, fetch the specific score
            query = `
                SELECT student_id, ac_id, value
                FROM ac_scores
                WHERE student_id = ? AND ac_id = ?
            `;
            params.push(ac_id);
        } else {
            // If ac_id is not provided, fetch all scores for the student
            query = `
                SELECT student_id, ac_id, value
                FROM ac_scores
                WHERE student_id = ?
            `;
        }

        const [results] = await db.execute(query, params);

        if (results.length === 0) {
            // No record found
            return res.status(404).json({
                message: 'No score found for the given Student ID and Assessment Criteria ID.',
            });
        }

        // Return the score(s)
        return res.status(200).json({
            message: 'Score(s) fetched successfully.',
            scores: results, // Return the results
        });
    } catch (err) {
        console.error('Error fetching score:', err);

        return res.status(500).json({
            message: 'Server error while fetching score.',
            error: err.message,
        });
    }
});

export default router; // Export the router