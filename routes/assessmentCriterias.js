// routes/assessmentCriterias.js
import express from "express";
import db from "../db/db.js"; 

const router = express.Router();
// GET api for assessment criteria
router.get("/", async (req, res) => {
    const { subject, year, quarter } = req.headers; 
    console.log(`Subject: ${subject}, Year: ${year}, Quarter: ${quarter}`);
    if (!subject || !year || !quarter) {
        return res.status(400).json({
            message: 'Invalid input. Subject, Year, and Quarter are required in the headers.',
        });
    }

    try {
        const query = `
            SELECT id, name, max_marks
            FROM assessment_criterias
            WHERE subject = ? AND year = ? AND quarter = ?`;

        const [results] = await db.execute(query, [subject, year, quarter]);
        if (results.length === 0) {
            return res.status(404).json({
                message: 'No assessment criterias found for the given filters.',
            });
        }
        return res.status(200).json({
            message: 'Assessment criterias retrieved successfully',
            assessments: results,
        });
    } catch (err) {
        console.error('Error retrieving assessment criterias:', err);

        return res.status(500).json({
            message: 'Server error while fetching assessment criterias',
            error: err.message,
        });
    }
});

// POST api to add a new assessment criteria
router.post("/", async (req, res) => {
    const { year, quarter, subject } = req.headers;
    const { max_marks, name } = req.body;

    if (!year || !quarter || !subject || !max_marks || !name) {
        return res.status(400).json({
            message: 'Missing required fields. Ensure year, quarter, subject (headers), and max_marks, name (body) are provided.',
        });
    }

    try {
        const insertQuery = `
            INSERT INTO assessment_criterias (name, max_marks, year, quarter, subject)
            VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.execute(insertQuery, [
            name,
            max_marks,
            year,
            quarter,
            subject,
        ]);

        return res.status(201).json({
            message: 'Assessment criterion added successfully',
            insertedId: result.insertId,
        });
    } catch (err) {
        console.error('Error inserting assessment criteria:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Duplicate entry. This assessment criterion already exists.',
            });
        }

        return res.status(500).json({
            message: 'Server error while inserting assessment criteria',
            error: err.message,
        });
    }
});

export default router; 
