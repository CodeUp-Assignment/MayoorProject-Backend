// routes/students.js
import express from "express";
import db from "../db/db.js";

const router = express.Router();

// Get students
router.get('/', async (req, res) => {
    const year = req.headers['year'];
    const className = req.headers['class'];
    const section = req.headers['section'];

    if (!year || !className || !section) {
        return res.status(400).json({
            message: "Missing required headers. Please provide 'year', 'class', and 'section'."
        });
    }

    if (isNaN(year) || isNaN(className) || !section.trim()) {
        return res.status(400).json({
            message: "Invalid header values. 'year' and 'class' should be numbers, and 'section' cannot be empty."
        });
    }

    try {
        const query = `
            SELECT s.name 
            FROM students s 
            JOIN students_records sc ON s.id = sc.student_id 
            WHERE sc.year = ? AND sc.class = ? AND sc.section = ?
        `;

        const [results] = await db.execute(query, [year, className, section]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'No students found for the given year, class, and section.' });
        }

        return res.status(200).json({ Students: results });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Add a new student
router.post('/', async (req, res) => {
    const year = req.headers['year'];
    const className = req.headers['class'];
    const section = req.headers['section'];
    const studentName = req.body.studentName;

    if (!year || !className || !section || !studentName) {
        return res.status(400).json({
            message: "Missing required headers. Please provide 'year', 'class', 'section' and 'studentName'."
        });
    }
    if (isNaN(year) || isNaN(className) || !section.trim() || !studentName.trim()) {
        return res.status(400).json({
            message: "Invalid header values. 'year' and 'class' should be numbers, and 'section' cannot be empty."
        });
    }
    try {
        const insertStudentQuery = `
            INSERT INTO students (id, name)
            SELECT COALESCE(MAX(id), 0) + 1, ? FROM students`;
        await db.execute(insertStudentQuery, [studentName]);
        const [newStudentIdRow] = await db.execute('SELECT MAX(id) AS newId FROM students');
        const newStudentId = newStudentIdRow[0].newId;
        const insertRecordQuery = `
            INSERT INTO students_records (id, student_id, class, section, year)
            SELECT COALESCE(MAX(id), 0) + 1, ?, ?, ?, ? FROM students_records`;
        await db.execute(insertRecordQuery, [newStudentId, className, section, year]);
        return res.status(201).json({
            message: "Student and record inserted successfully"
        });
    } catch (error) {
        console.error('Error during student insertion:', error);
        return res.status(500).json({
            message: "An error occurred while inserting student and record.",
            error: error.message
        });
    }
});

export default router;