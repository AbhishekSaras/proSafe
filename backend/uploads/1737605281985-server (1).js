// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./config/db');  // Import db.js

// Initialize Express app
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Login route
app.post('/login', async (req, res) => {
  const { role, username, password } = req.body;

  // Input validation
  if (!role || !username || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    console.log('Login request received:', { role, username, password }); // Log request data

    // Query to check credentials
    const query = `
      SELECT * FROM login
      WHERE role = $1
      AND (email = $2 OR phone_no = $2)
      AND password = $3
    `;
    const values = [role, username, password];
    const result = await pool.query(query, values);

    console.log('Query result:', result.rows); // Debugging log

    // Check if any user matches
    if (result.rows.length > 0) {
      res.status(200).json({ message: 'Login successful!' });
    } else {
      res.status(401).json({ message: 'Invalid credentials. Please try again.' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get marks data
app.get('/marks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM marks');
    const hii = res.json(result.rows); // Send marks data to frontend
    console.log(hii);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch marks data' });
  }
});

// Post new marks
app.post('/marks', async (req, res) => {
  console.log('Received marks data:', req.body);  // Log the incoming data

  const { student_id, student_name, subject, marks, class: className, section, examType } = req.body;

  try {
    const query = 'INSERT INTO marks(student_id, student_name, subject, marks, class, section, exam_type,) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
    await pool.query(query, [studentId, studentName, subject, marks, className, section, examType, new Date ]);
    res.status(201).json({ message: 'Marks added successfully' });
  } catch (err) {
    console.error('Error inserting data:', err);
    res.status(500).json({ error: 'Failed to add marks' });
  }
});

// Edit marks
app.put('/marks/:id', async (req, res) => {
  const { id } = req.params;
  const { studentName, subject, class: className, section, exam_type, date, marks } = req.body;

  try {
    const query = `
      UPDATE marks 
      SET student_name = $1, subject = $2, class = $3, section = $4, exam_type = $5, date = $6, marks = $7 
      WHERE student_id = $8 
      RETURNING *;
    `;
    const result = await pool.query(query, [studentName, subject, className, section, exam_type, date, marks, id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating marks:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Delete marks
app.delete('/marks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM marks WHERE student_id = $1', [id]);
    res.status(200).send('Deleted successfully');
  } catch (error) {
    console.error('Error deleting marks:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Get teacher data by teacher_id
app.get('/api/teacher/:teacher_id', async (req, res) => {
  const { teacher_id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM teacher_register WHERE teacher_id = $1', [teacher_id]);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);  // Send teacher data as response
    } else {
      res.status(404).json({ message: 'Teacher not found' });
    }
  } catch (error) {
    console.error('Error fetching teacher data:', error);
    res.status(500).json({ error: 'Failed to fetch teacher data' });
  }
});

// Get all assignments
app.get('/api/assignments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM add_assignment');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Add a new assignment
app.post('/api/assignments', async (req, res) => {
  const { teacher_id, className, section, title, date, due_date, subject, source_file, submitted_status } = req.body;

  try {
    // Fetch teacher data using the teacher_id
    const teacherResult = await pool.query('SELECT * FROM teacher_register WHERE teacher_id = $1', [teacher_id]);

    if (teacherResult.rows.length > 0) {
      const teacher_name = teacherResult.rows[0].teacher_name;  // Assuming teacher_name is the column in teacher_register table

      // Insert the assignment data with the teacher_name
      const result = await pool.query(
        `INSERT INTO add_assignment (teacher_id, teacher_name, class, section, title, date, due_date, subject, source_file, submitted_status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [teacher_id, teacher_name, className, section, title, date, due_date, subject, source_file, submitted_status]
      );

      res.status(201).json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Teacher not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add assignment' });
  }
});

// Get all student submissions for a specific assignment
app.get('/api/submissions/:assignment_id', async (req, res) => {
  const { assignment_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM submitted_assignment WHERE assignment_id = $1`,
      [assignment_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
