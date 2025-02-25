 import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import cors from 'cors';
import multer from 'multer';
import path, { dirname } from 'path';
import dotenv from "dotenv";
import fs from 'fs';
import { fileURLToPath } from 'url';
import { log } from 'console';

// Define __dirname for ES modules
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads')); // Serve static files from the uploads directory


// Set up multer for file uploads

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the directory to save uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to the file name
  }
});
const upload = multer({ storage });
// Define __dirname for ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// Initialize the express application
// const app = express();
// const port = 5000;

// // Enable CORS
// app.use(cors());

// // Middleware to parse JSON requests
// app.use(bodyParser.json());

// // Serve static files (for uploaded files)
// const uploadDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }
// app.use('/uploads', express.static(uploadDir));

// // Configure multer storage for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });
// const upload = multer({ storage });

// PostgreSQL database connection
const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'School_management_system_project',
  password: 'padma_postgres',
  port: 5432,
});

db.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Database connection error:', err));

// Routes

// Login route
 app.post('/login', async (req, res) => {
  const { role, username, password } = req.body;

  if (!role || !username || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  let tableName;
  let columnName;

  // Determine the table and column based on the role
  if (role === 'teacher') {
    tableName = 'teacher_register';
    columnName = 'teacher_id';
  } else if (role === 'admin') {
    tableName = 'admin_register';
    columnName = 'admin_id';
  } else if (role === 'student') {
    tableName = 'student_register';
    columnName = 'student_id';
  } else if (role === 'parent') {
    tableName = 'parent_register';
    columnName = 'parent_id';
  } else {
    return res.status(400).json({ message: 'Invalid role.' });
  }

  try {
    // Query to check if the user exists and the password matches
    const query = `
      SELECT * FROM ${tableName}
      WHERE (email = $1 OR contact = $1) AND password = $2
    `;
    const result = await db.query(query, [username, password]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.status(200).json({
        message: 'Login successful!',
        user_id: user[columnName],  // Dynamic user ID based on the role
        full_name: user.full_name,
        subject:user.subject,
        role: user.role,
        email: user.email,
        phone_no: user.contact,
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials. Please try again.' });
    }
  } catch (error) { 
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Fetch events
app.get('/events', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM event');
    const events = result.rows.map(event => ({
      title: event.title,
      start: event.start_date,
      end: event.end_date,
      allDay: true,
    }));
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Fetch schedules for a specific teacher
app.get('/schedules/:teacherId', async (req, res) => {
  const teacherId = req.params.teacherId;
  try {
    const result = await db.query('SELECT * FROM schedules WHERE id = $1', [teacherId]);
    res.json(result.rows.length > 0 ? result.rows : []);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).send('Server Error');
  }
});


 app.get('/teacher2/:id', async (req, res) => {
  const teacherId = req.params.id;
  try {
    const result = await db.query('SELECT * FROM teacher_register WHERE teacher_id = $1', [teacherId]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Teacher not found');
    }
  } catch (error) {
    console.error('Error fetching teacher data:', error);
    res.status(500).send('Server error');
  }
});

// API to fetch teacher details including profile image
app.get('/api/teacher3/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("SELECT * FROM teacher_register WHERE teacher_id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching teacher data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});





 // Route to get student data
app.get('/students', async (req, res) => {
  try {
    const result = await db.query('SELECT student_id, full_name, class, section FROM student_register');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});
 // API endpoint to fetch teacher data by ID
app.get('/teachers/:id', async (req, res) => {
  const teacherId = req.params.id;
  try {
    const result = await db.query('SELECT * FROM teacher_register WHERE teacher_id = $1', [teacherId]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]); // Send the teacher data including photo
    } else {
      res.status(404).send('Teacher not found');
    }
  } catch (error) {
    console.error('Error fetching teacher data:', error);
    res.status(500).send('Server error');
  }
});

// API endpoint to fetch teacher schedule by ID
app.get('/schedules/:teacherId', async (req, res) => {
  const teacherId = req.params.teacherId; // Ensure the parameter name matches
  try {
    const result = await db.query('SELECT * FROM class_schedule WHERE teacher_id = $1', [teacherId]);
    res.json(result.rows); // Return an empty array if no schedule is found
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).send('Server error');
  }
});
//Backend (server.js)
app.put('/updateMarks', (req, res) => {
    const { studentId, studentName, className, section, exam_type, subject, marks } = req.body;
  
    console.log("Received updateMarks request:", req.body);
  
    // Check data types
    console.log("Data types: ", {
      studentId: typeof studentId,
      studentName: typeof studentName,
      className: typeof className,
      section: typeof section,
      exam_type: typeof exam_type,
      subject: typeof subject,
      marks: typeof marks
    });
  
    const query = `
      UPDATE marks
      SET marks = $5
      WHERE student_id = $1 AND student_name = $2 AND class = $3 AND section = $4 AND exam_type = $6 AND subject = $7
    `;
  
    db.query(query, [studentId, studentName, className, section, marks, exam_type, subject])
      .then(() => {
        console.log("Marks updated successfully in database");
        res.json({ message: 'Marks updated successfully' });
      })
      .catch(error => {
        console.error('Error updating marks:', error);
        res.status(500).json({ error: 'Failed to update marks', details: error.message });
      });
  });
  
  

app.get('/getMarks', (req, res) => {
  const { studentId, studentName, className, section, exam_type } = req.query;

  if (!studentId || !studentName || !className || !section || !exam_type) {
      return res.status(400).json({ error: 'All fields are required' });
  }

  const query = `
      SELECT subject, marks, CASE 
          WHEN CAST(marks AS INTEGER) >= 10 THEN 'Pass'
          ELSE 'Fail'
      END AS status
      FROM marks
      WHERE student_id = $1 AND student_name = $2 AND class = $3 AND section = $4 AND exam_type = $5
  `;

  db.query(query, [studentId, studentName, className, section, exam_type])
      .then((result) => res.json(result.rows))
      .catch((error) => {
          console.error('Error fetching marks:', error);
          res.status(500).json({ error: 'Failed to fetch marks' });
      });
});

app.get('/getParentDetails/:studentId', (req, res) => {
  const { studentId } = req.params;

  const getParentQuery = `
      SELECT parent_id, full_name AS parentName
      FROM parent_register
      WHERE student_id = $1
  `;

  db.query(getParentQuery, [studentId])
      .then((result) => {
          if (result.rows.length === 0) {
              // If no parent details are found, send a default response
              console.log(`No parent found for student ID: ${studentId}`); // Debugging
              return res.status(200).json({ parent_id: null, parentName: null });
          }

          const parentDetails = result.rows[0];
          console.log(`Parent details found:`, parentDetails); // Debugging
          res.status(200).json(parentDetails);
      })
      .catch((error) => {
          console.error('Error fetching parent details:', error);
          res.status(500).json({ error: 'Failed to fetch parent details.' });
      });
});

app.post('/sendReport', async (req, res) => {
  try {
      const {
          studentId,
          studentName,
          className,
          section,
          parentId,
          parentName,
          teacher_id,
          teacher_name,
          examType,
          marksData,
      } = req.body;

      console.log("Received report data:", req.body); // Debugging: Log the entire request body

      // Ensure marksData is an array
      if (!Array.isArray(marksData)) {
          return res.status(400).json({ error: 'marksData must be an array' });
      }

      // Insert each subject's data into the database
      for (const mark of marksData) {
          const { subject, marks, totalMarks, percentage, status } = mark;

          // Validate marks, totalMarks, and percentage are numbers
          const parsedMarks = Number(marks);
          const parsedTotalMarks = Number(totalMarks);
          const parsedPercentage = Number(percentage);

          if (isNaN(parsedMarks)) {
              return res.status(400).json({ error: 'Marks must be a number', subject: subject });
          }

          if (isNaN(parsedTotalMarks)) {
              return res.status(400).json({ error: 'Total Marks must be a number', subject: subject });
          }

          if (isNaN(parsedPercentage)) {
              return res.status(400).json({ error: 'Percentage must be a number', subject: subject });
          }


          // Insert into database
          const query = `
              INSERT INTO marks_reports
              (student_id, student_name, class, section, parent_id, parent_name, teacher_id, teacher_name, exam_type, subject, marks, total_marks, percentage, status)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          `;
          const values = [
              studentId,
              studentName,
              className,
              section,
              parentId,
              parentName,
              teacher_id,
              teacher_name,
              examType,
              subject,
              parsedMarks, // Use the parsed number
              parsedTotalMarks, // Use the parsed number
              parsedPercentage, // Use the parsed number
              status, // Store 'Pass' or 'Fail' string directly
          ];

          console.log("Executing query:", query); // Debugging: Log the query
          console.log("With values:", values); // Debugging: Log the values

          await db.query(query, values);
      }

      res.status(201).json({ message: 'Report saved successfully' });
  } catch (error) {
      console.error('Error saving report:', error.message);
      res.status(500).json({ error: 'Failed to save report', details: error.message });
  }
});
// Upload syllabus----------------------------------------------------------------
// Add Syllabus
app.post('/syllabus', upload.single('file'), async (req, res) => {
  const { subject, sub_topic, date, class: className, teacher_id, teacher_name } = req.body;
  const file = req.file ? req.file.filename : null;

  try {
    const result = await db.query(
      'INSERT INTO syllabus (subject, sub_topic, date, file, class, teacher_id, teacher_name) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [subject, sub_topic, date, file, className, teacher_id, teacher_name]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding syllabus:', error);
    res.status(500).json({ error: 'Failed to add syllabus' });
  }
}); 

// Get all classes from classtimetable
app.get('/classes', async (req, res) => {
  try {
    const result = await db.query('SELECT DISTINCT class_name FROM classtimetable');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get syllabus for all classes
app.get('/syllabus', async (req, res) => {
  const {teacher_id,teacher_name} = req.query;
  try {
    const result = await db.query('SELECT * FROM syllabus where teacher_id=$1 and teacher_name=$2 order by syllabus_id',
      [teacher_id,teacher_name]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching syllabus:', error);
    res.status(500).json({ error: 'Failed to fetch syllabus' });
  }
});

// Update a syllabus
app.put('/syllabus/:id', upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const { subject, sub_topic, date, class: className, teacher_id, teacher_name } = req.body;
  const file = req.file ? req.file.filename : null;

  try {
    const result = await db.query(
      'UPDATE syllabus SET subject = $1, sub_topic = $2, date = $3, file = COALESCE($4, file), class = $5, teacher_id = $6, teacher_name = $7 WHERE syllabus_id = $8 RETURNING *',
      [subject, sub_topic, date, file, className, teacher_id, teacher_name, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating syllabus:', error);
    res.status(500).json({ error: 'Failed to update syllabus' });
  }
});

// Delete a syllabus
app.delete('/syllabus/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM syllabus WHERE syllabus_id = $1', [id]);
    res.json({ message: 'Syllabus deleted successfully' });
  } catch (error) {
    console.error('Error deleting syllabus:', error);
    res.status(500).json({ error: 'Failed to delete syllabus' });
  }
});


// Get all classes
app.get('/api/class5', async (req, res) => {
  try {
    const result = await db.query('SELECT DISTINCT class_name FROM classtimetable');
    const classes = result.rows.map((row) => row.class_name);
    res.json({ classes });
  } catch (error) {
    res.status(500).send('Error fetching classes');
  }
});

// Get sections for a class
app.get('/api/sections/:class', async (req, res) => {
  const { class: className } = req.params;
  try {
    const result = await db.query(
      'SELECT DISTINCT section FROM classtimetable WHERE class_name = $1',
      [className]
    );
    const sections = result.rows.map((row) => row.section);
    res.json({ sections });
  } catch (error) {
    res.status(500).send('Error fetching sections');
  }
});

// Get timetable based on class, section, and optional day
app.get('/api/timetable/:class/:section/:day?', async (req, res) => {
  const { class: className, section, day } = req.params;
  try {
    let query =
      'SELECT teacher_id, teacher_name, subject, day, time FROM classtimetable WHERE class_name = $1 AND section = $2';
    const params = [className, section];
    if (day) {
      query += ' AND LOWER(day) = LOWER($3)';
      params.push(day);
    }
    const timetable = await db.query(query, params);
    if (timetable.rows.length === 0) {
      return res.status(404).json({ error: 'No timetable found for the given criteria.' });
    }
    res.json(timetable.rows);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get timetable data
app.get("/api/examtimetable", async (req, res) => {
  const { class: className, section, examType } = req.query;
  try {
    const result = await db.query(
      `SELECT day, subject, date, time
       FROM exam_timetable
       WHERE class_name = $1 AND section = $2 AND exam_type = $3
       ORDER BY date`,
      [className, section, examType]
    );
    res.json({ timetable: result.rows });
  } catch (error) {
    res.status(500).send("Error fetching timetable");
  }
});

app.get("/api/class-section", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT DISTINCT class_name, section FROM classtimetable ORDER BY class_name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching class and section data" });
  }
});

// Fetch marks data
app.get("/api/marks", async (req, res) => {
  try {
    const { class_name, section, exam_type,teacher_id,teacher_name } = req.query;
    const query = `
      SELECT student_id, student_name, subject, class, section, exam_type, marks
      FROM marks
      WHERE class = $1 AND section = $2 AND exam_type = $3 AND teacher_id=$4 AND teacher_name =$5
    `;
    const result = await db.query(query, [class_name, section, exam_type,teacher_id,teacher_name]);
    res.json(result.rows);
   
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching marks data" });
  }
});

/*-----------------------------------communications-----------------------------------------*/ 


app.get("/api/messages", async (req, res) => {
  const { teacher_id, teacher_name } = req.query;

  try {
    const result = await db.query(
      `SELECT role, owner_name, title, description, date, message_id FROM communication
       WHERE NOT owner_id = $1 AND NOT owner_name = $2
       ORDER BY message_id`,
      [teacher_id, teacher_name]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// Fetch Communications
app.get("/api/communications", async (req, res) => {
  const { teacher_id, teacher_name } = req.query;

  try {
    const result = await db.query(
      "SELECT * FROM communication WHERE owner_id = $1 AND owner_name = $2 ORDER BY message_id",
      [teacher_id, teacher_name]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Communication
app.post("/api/communications", async (req, res) => {
  const { role, id, name, title, description, teacher_id, teacher_name } = req.body;

  const columnMap = {
    teacher: "teacher_id",
    parent: "parent_id",
    admin: "admin_id",
    student: "student_id",
  };

  const column = columnMap[role];
  if (!column) return res.status(400).json({ error: "Invalid role specified" });

  try {
    const result = await db.query(
      `INSERT INTO communication (role, ${column}, name, title, description, owner_id, owner_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [role, id, name, title, description, teacher_id, teacher_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Communication
app.delete("/api/communications/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM communication WHERE message_id = $1", [id]);
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send Notification
 app.post("/api/notifications", async (req, res) => {
  const { role, title, description } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO notification (role, title, description, time, date, read)
       VALUES ($1, $2, $3, CURRENT_TIME, CURRENT_DATE, FALSE) RETURNING *`,
      [role, title, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get notifications from the database
app.get("/api/notifications", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM notification ORDER BY date DESC, time DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});



// Mark a notification as read and insert a reply
app.put("/api/notifications/:id", async (req, res) => {
  const notificationId = req.params.id;
  const { read } = req.body;

  try {
    await db.query(
      "UPDATE notification SET read = $1 WHERE id = $2",
      [read, notificationId]
    );
    res.status(200).json({ message: "Notification updated successfully" });
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// Add a reply to a notification
app.post("/api/reply-notifications", async (req, res) => {
  const { role, title, description, date, time } = req.body;

  try {
    const result = await db.query(
      "INSERT INTO reply_notification (role, title, description, date, time) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [role, title, description, date, time]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({ error: "Failed to add reply" });
  }
});


 app.post("/api/leave", async (req, res) => {
  try {
    const { teacherName, leaveFrom, leaveTo, reason, teacherId } = req.body; // teacherName should be received as is

    // Validate input fields
    if ( !leaveFrom || !leaveTo || !reason ) {
      return res.status(400).json({ error: "Please fill all the required fields." });
    }

    // Validate date format (optional)
    const isValidDate = (date) => !isNaN(Date.parse(date));
    if (!isValidDate(leaveFrom) || !isValidDate(leaveTo)) {
      return res.status(400).json({ error: "Invalid date format for leaveFrom or leaveTo." });
    }

    // Insert data into teacher_leave table
    const insertLeaveQuery = `
      INSERT INTO teacher_leave (teacher_id, name, leave_from, leave_to, reason, status)
      VALUES ($1, $2, $3, $4, $5, 'pending');
    `;
    await db.query(insertLeaveQuery, [teacherId, teacherName, leaveFrom, leaveTo, reason]);

    res.status(201).json({ message: "Leave request submitted successfully." });
  } catch (error) {
    console.error("Error submitting leave request:", error.message);
    res.status(500).json({ error: "An error occurred while submitting the leave request." });
  }
});

// Endpoint to get teacher leave requests
app.get("/api/teacher-leaves", async (req, res) => {
  const {teacher_id,teacher_name}=req.query;
  try {
    const result = await db.query("SELECT * FROM teacher_leave WHERE teacher_id=$1 AND name=$2 ", [teacher_id, teacher_name]);

     
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    res.status(500).json({ error: "An error occurred while fetching leave requests." });
  }
});

// Fetch student leave requests
app.get("/api/student-leaves", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM leave_requests");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching student leave requests:", error);
    res.status(500).send("Error fetching student leave requests.");
  }
});

// Update leave request status
app.post("/api/leave-status", async (req, res) => {
  const { id, status } = req.body;
  try {
    await db.query("UPDATE leave_requests SET status = $1 WHERE id = $2", [status, id]);
    res.send("Leave request status updated");
  } catch (error) {
    console.error("Error updating leave status:", error);
    res.status(500).send("Error updating leave status.");
  }
});

// Approve Leave Request
app.put('/api/student-leaves/approve/:id', async (req, res) => {
  const { id } = req.params;

  try {
      const result = await db.query(
          'UPDATE leave_requests SET status = $1 WHERE id = $2',
          ['approved', id]  // Changed to lowercase 'approved' for consistency
      );

      if (result.rowCount > 0) {
          res.status(200).json({ message: 'Leave request approved successfully.' });
      } else {
          res.status(404).json({ message: 'Leave request not found.' });
      }
  } catch (error) {
      console.error('Error approving leave request:', error);
      res.status(500).json({ message: 'Failed to approve leave request.', error: error.message }); // Include error message
  }
});

// Reject Leave Request
app.put('/api/student-leaves/reject/:id', async (req, res) => {
  const { id } = req.params;

  try {
      const result = await db.query(
          'UPDATE leave_requests SET status = $1 WHERE id = $2',
          ['rejected', id] // Changed to lowercase 'rejected' for consistency
      );

      if (result.rowCount > 0) {
          res.status(200).json({ message: 'Leave request rejected successfully.' });
      } else {
          res.status(404).json({ message: 'Leave request not found.' });
      }
  } catch (error) {
      console.error('Error rejecting leave request:', error);
      res.status(500).json({ message: 'Failed to reject leave request.', error: error.message }); // Include error message
  }
});


// Fetch Timetable Data
 app.get("/api/classtimetable", async (req, res) => {
  try {
    const [classesQuery, sectionsQuery, subjectsQuery] = await Promise.all([
      db.query("SELECT DISTINCT class_name FROM classtimetable"),
      db.query("SELECT DISTINCT section FROM classtimetable"),
      db.query("SELECT DISTINCT subject FROM classtimetable"),
    ]);

    res.json({
      classes: classesQuery.rows.map((row) => row.class_name),
      sections: sectionsQuery.rows.map((row) => row.section),
      subjects: subjectsQuery.rows.map((row) => row.subject),
    });
  } catch (error) {
    console.error("Error fetching timetable data:", error.message);
    res.status(500).json({ error: "Error fetching timetable data" });
  }
});

// Get All Marks
app.get("/api/classmarks", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM marks ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    console.error("Error retrieving marks:", error.message);
    res.status(500).send("Error retrieving marks.");
  }
});

// Add New Marks
app.post("/api/classmarks", async (req, res) => {
  const {
    student_id,
    student_name,
    teacherId,
    teacherName,
    subject,
    class: className,
    section,
    exam_type,
    marks,
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO marks 
        (student_id, student_name, teacher_id, teacher_name, subject, class, section, exam_type, marks) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [student_id, student_name, teacherId, teacherName, subject, className, section, exam_type, marks]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding marks:", error.message);
    res.status(500).send("Error adding marks.");
  }
});

// Update Marks by ID
app.put("/api/classmarks/:id", async (req, res) => {
  const { id } = req.params;
  const { student_name, teacher_name, subject, class: className, section, exam_type, marks } = req.body;

  try {``
    const result = await db.query(
      `UPDATE marks 
        SET student_name = $1, teacher_name = $2, subject = $3, class = $4, section = $5, exam_type = $6, marks = $7 
      WHERE id = $8 
      RETURNING *`,
      [student_name, teacher_name, subject, className, section, exam_type, marks, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Mark record not found." });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating marks:", error.message);
    res.status(500).send("Error updating marks.");
  }
});

// Delete Marks by ID
app.delete("/api/classmarks/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM marks WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Mark record not found." });
    }
    res.status(200).json({ message: "Mark record deleted successfully." });
  } catch (error) {
    console.error("Error deleting marks:", error.message);
    res.status(500).send("Error deleting marks.");
  }
});

app.get("/attendances", async (req, res) => {
  const { teacher_id, teacher_name } = req.query; // Get teacher_id and teacher_name from query params
  try {
    // Use parameterized queries to prevent SQL injection
    const result = await db.query(
      "SELECT * FROM student_attendance WHERE teacher_id = $1 AND teacher_name = $2 ORDER BY id",
      [teacher_id, teacher_name] // Pass the teacher_id and teacher_name as parameters
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    res.status(500).json({ error: "Failed to fetch attendance data" });
  }
});


// Add attendance
app.post("/attendances", async (req, res) => {
  const { studentId, studentName, class: className, section, status, teacherId, teacherName } = req.body;

  // Ensure teacherId and teacherName are included
  if (!teacherId || !teacherName) {
    res.status(400).json({ error: "Teacher ID and name are required" });
    return;
  }

  try {
    const result = await db.query(
      `INSERT INTO student_attendance 
       (student_id, student_name, class, section, status, teacher_id, teacher_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [studentId, studentName, className, section, status, teacherId, teacherName]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error adding attendance:", error);
    res.status(500).json({ error: "Failed to add attendance" });
  }
});

app.put("/attendances/:id", async (req, res) => {
  const { id } = req.params; // Get attendance ID
  const { studentId, studentName, class: className, section, status, teacherId, teacherName } = req.body;

  try {
    const result = await db.query(
      `UPDATE student_attendance 
       SET student_id = $1, student_name = $2, class = $3, section = $4, 
           status = $5, teacher_id = $6, teacher_name = $7 
       WHERE id = $8 RETURNING *`,
      [studentId, studentName, className, section, status, teacherId, teacherName, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error editing attendance:", error);
    res.status(500).json({ error: "Failed to edit attendance" });
  }
});

// Delete attendance
app.delete("/attendances/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM student_attendance WHERE id=$1", [id]);
    res.status(200).json({ message: "Attendance deleted" });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    res.status(500).json({ error: "Failed to delete attendance" });
  }
});


// Create an assignment
app.post("/assignments1", upload.single("source_file"), async (req, res) => {
  const {
    teacher_id,
    teacher_name,
    class: className,
    section,
    title,
    due_date,
    subject,
  } = req.body;

  const filePath = req.file ? req.file.path : null;

  try {
    const result = await db.query(
      `INSERT INTO add_assignment_std (teacher_id, teacher_name, class, section, title, due_date, subject, source_file)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [teacher_id, teacher_name, className, section, title, due_date, subject, filePath]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// View all assignments
app.get("/assignments1", async (req, res) => {
  const { teacher_id, teacher_name } = req.query; 
  try {
    const result = await db.query("SELECT * FROM add_assignment_std WHERE teacher_id = $1 AND teacher_name = $2 order by assignment_id",
      [teacher_id, teacher_name] 
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});




// DELETE endpoint to delete an assignment by ID
app.delete("/assignments1/:id", async (req, res) => {
  const assignmentId = parseInt(req.params.id);

  try {
    const result = await db.query(
      "DELETE FROM add_assignment_std WHERE assignment_id = $1",
      [assignmentId]
    );

    if (result.rowCount > 0) {
      res.status(200).json({ message: "Assignment deleted successfully" });
    } else {
      res.status(404).json({ message: "Assignment not found" });
    }
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ message: "Error deleting assignment" });
  }
});




// Fetch classes and sections from student_register table
app.get("/api/classes", async (req, res) => {
  try {
    const result = await db.query("SELECT DISTINCT class, section FROM student_register");
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Submit assignment details
app.post("/api/submit-assignment", async (req, res) => {
  const { assignment_id, student_id, student_name, className, section, submitted_status } = req.body;

  try {
    await db.query(
      "INSERT INTO submitted_assignment_std (assignment_id, student_id, student_name, class, section, submitted_status) VALUES ($1, $2, $3, $4, $5, $6)",
      [assignment_id, student_id, student_name, className, section, submitted_status]
    );
    res.json({ message: "Assignment submitted successfully" });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Fetch submitted assignment details
app.get("/api/submitted-assignments", async (req, res) => {
  const { teacher_id, teacher_name } = req.query; // Use req.query instead of req.body

  try {
    const result = await db.query(
      "SELECT * FROM submitted_assignment_std WHERE teacher_id = $1 AND teacher_name = $2 ORDER BY submission_id",
      [teacher_id, teacher_name] // Pass parameters as an array
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});



//student portal

// Get fees for a specific student
app.get("/api/fees", async (req, res) => {
  const { studentId } = req.query; // Extract studentId from query parameters

  if (!studentId) {
    return res.status(400).json({ error: "Student ID is required" });
  }

  try {
    const result = await db.query(
      "SELECT * FROM fees_history WHERE student_id = $1 ORDER BY student_id",
      [studentId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching fees data:", error);
    res.status(500).json({ error: "Failed to fetch fees data" });
  }
});

/*--------------------------------------------------*/ 
app.get('/api/studentPhoto/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("SELECT * FROM student_register WHERE student_id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching student data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// // Add a new fee
// app.post("/api/fees", async (req, res) => {
//   const { title, amount, dueDate, status } = req.body;

//   try {
//     const result = await db.query(
//       "INSERT INTO fees_history (title, amount, due_date, status) VALUES ($1, $2, $3, $4) RETURNING *",
//       [title, amount, dueDate, status]
//     );
//     res.status(201).json(result.rows[0]);
//   } catch (error) {
//     console.error("Error adding new fee:", error);
//     res.status(500).json({ error: "Failed to add fee" });
//   }
// });
// // Update a fee's status
// app.put("/api/fees/:id", async (req, res) => {
//   const { id } = req.params;
//   const { status } = req.body;

//   try {
//     const result = await db.query(
//       "UPDATE fees SET status = $1 WHERE id = $2 RETURNING *",
//       [status, id]
//     );

//     if (result.rowCount === 0) {
//       return res.status(404).json({ error: "Fee not found" });
//     }

//     res.status(200).json(result.rows[0]);
//   } catch (error) {
//     console.error("Error updating fee status:", error);
//     res.status(500).json({ error: "Failed to update fee status" });
//   }
// });
// // Delete a fee
// app.delete("/api/fees/:id", async (req, res) => {
//   const { id } = req.params;

//   try {
//     const result = await db.query("DELETE FROM fees WHERE id = $1", [id]);

//     if (result.rowCount === 0) {
//       return res.status(404).json({ error: "Fee not found" });
//     }

//     res.status(200).json({ message: "Fee deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting fee:", error);
//     res.status(500).json({ error: "Failed to delete fee" });
//   }
// });
// Get attendance for a specific student
app.get("/api/attendance", async (req, res) => {
  const { studentId } = req.query;

  if (!studentId) {
    return res.status(400).json({ message: "Student ID is required" });
  }

  try {
    const result = await db.query(
      "SELECT * FROM student_attendance WHERE student_id = $1",
      [studentId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    res.status(500).json({ message: "Error fetching attendance data" });
  }
});
// Get examinations for a specific student
 

// API: Fetch exams for a specific student ID
app.get("/api/examinations", async (req, res) => {
  const { studentId } = req.query;

  if (!studentId) {
    return res.status(400).json({ error: "Student ID is required" });
  }

  console.log("Requested Student ID:", studentId);

  try {
    // Fetch student's class and section from DB
    const studentQuery = await db.query(
      "SELECT class, section FROM student_register WHERE student_id = $1",
      [studentId]
    );

    if (studentQuery.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const { class: studentClass, section } = studentQuery.rows[0];
    console.log("Student Class & Section:", studentClass, section);

    // Fetch exams *ONLY* for this student
    const examQuery = await db.query(
      `SELECT subject, date, time, exam_type 
       FROM exam_timetable 
       WHERE class_name = $1 AND section = $2 
       ORDER BY date ASC`,
      [studentClass, section]
    );

    console.log("Fetched Exams for Student:", examQuery.rows);

    res.status(200).json(examQuery.rows);
  } catch (error) {
    console.error("Error fetching examination data:", error.message);
    res.status(500).json({ error: "Failed to fetch examination data" });
  }
});




// Get student's class and section based on student_id
app.get("/api/timetables", async (req, res) => {
  try {
    const { student_id } = req.query;

    if (!student_id) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    // Fetch class and section for the student
    const studentQuery = `
      SELECT class, section FROM student_register WHERE student_id = $1
    `;
    const studentResult = await db.query(studentQuery, [student_id]);

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const { class: studentClass, section } = studentResult.rows[0];

    // Fetch timetable based on class and section
    const timetableQuery = `
      SELECT day, subject, teacher_name , time
      FROM classtimetable
      WHERE class_name = $1 AND section = $2
      ORDER BY day, time;
    `;
    const timetableResult = await db.query(timetableQuery, [studentClass, section]);

    if (timetableResult.rows.length === 0) {
      return res.status(404).json({ error: "No timetable found for this class and section" });
    }

    // Group timetable data by day
    const timetable = timetableResult.rows.reduce((acc, row) => {
      if (!acc[row.day]) {
        acc[row.day] = [];
      }
      acc[row.day].push({
        subject: row.subject,
        teacher_name: row.teacher_name,  // Renamed 'teacher' to 'teacher_name'
        time: row.time,
      });
      return acc;
    }, {});

    res.status(200).json(timetable);
  } catch (error) {
    console.error("Error fetching timetable:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Get events
app.get("/api/event", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM event");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching events:", error.message);
    res.status(500).send("Server error");
  }
});

// Get notifications
app.get('/api/notification1', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM notification ORDER BY date DESC');
    res.json(result.rows); // Send the notifications data as JSON
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Error fetching notifications' });
  }
});

//notification----------------------------------------------------------
// Get all unread notifications (count & list)
  app.get("/api/notification2", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM notification WHERE read = FALSE ORDER BY date DESC, time DESC");
    const countResult = await db.query("SELECT COUNT(*) FROM notification WHERE read = FALSE");

    res.json({ notifications: result.rows, unreadCount: parseInt(countResult.rows[0].count) });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark notification as read
app.put("/api/notification2/read/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("UPDATE notification SET read = TRUE WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send reply message
app.post("/api/reply2", async (req, res) => {
  const { role, title, description } = req.body;
  const currentDate = new Date().toISOString().split("T")[0];
  const currentTime = new Date().toLocaleTimeString();

  try {
    await db.query(
      "INSERT INTO reply_notification (role, title, description, date, time) VALUES ($1, $2, $3, $4, $5)",
      [role, title, description, currentDate, currentTime]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Get student profile
 
 app.get("/api/profile/:student_id", async (req, res) => {
   const { student_id } = req.params;
 
   try {
     const result = await db.query(
       "SELECT * FROM student_register WHERE student_id = $1",
       [student_id]
     );
 
     if (result.rows.length === 0) {
       return res.status(404).json({ error: "Profile not found" });
     }
 
     res.json(result.rows[0]);
   } catch (error) {
     console.error("Error fetching profile:", error);
     res.status(500).json({ error: "Internal server error" });
   }
 });
 
 
 



// Get grades for a student
app.get("/grades", async (req, res) => {
  const { studentId } = req.query;

  if (!studentId) {
    return res.status(400).json({ message: "Student ID is required" });
  }

  try {
    const result = await db.query(
      "SELECT * FROM marks WHERE student_id = $1 ",
      [studentId]
    );
    res.json(result.rows); 
  } catch (err) {
    console.error("Error fetching grades:", err);
    res.status(500).send("Server Error");
  }
});

/*-------------------------------------------------------------------------------------------*/ 
//Parent portal
//----------------------------------

app.get('/parent4/:id', async (req, res) => {
  const parentId = req.params.id;
  try {
      const result = await db.query('SELECT * FROM parent_register WHERE parent_id = $1', [parentId]);
      if (result.rows.length > 0) {
          res.json(result.rows[0]);
      } else {
          res.status(404).send('Parent not found');
      }
  } catch (error) {
      console.error('Error fetching parent data:', error);
      res.status(500).send('Server error');
  }
});

/*----------------leave--------------------*/ 
app.get('/api/studentleave', async (req, res) => {
  const parent_id = req.query.parentId;

  if (!parent_id) {
      return res.status(400).json({ message: 'Parent ID is required' });
  }

  try {
      const result = await db.query(
          'SELECT student_id, child_name FROM parent_register WHERE parent_id = $1',
          [parent_id]
      );

      res.json(result.rows.map(row => ({ id: row.student_id, full_name: row.child_name })));
  } catch (error) {
      console.error('Error fetching children:', error);
      res.status(500).json({ message: 'Server error' });
  }
});

// Get all leave requests
app.get('/leave-requests1', async (req, res) => {
  try {
      const result = await db.query('SELECT * FROM leave_requests');
      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching leave requests:', error);
      res.status(500).json({ message: 'Error fetching leave requests' });
  }
});

// Get leave requests by student id
app.get('/leave-requests1/:student_id', async (req, res) => {
  const { student_id } = req.params;
  try {
      const result = await db.query('SELECT * FROM leave_requests WHERE student_id = $1', [student_id]);
      if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Leave requests not found for this student' });
      }
      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching leave requests:', error);
      res.status(500).json({ message: 'Error fetching leave requests' });
  }
});

// Add a new leave request
app.post('/leave-requests1', async (req, res) => {
  console.log("Received leave request data:", req.body);
  const { student_id, student_name, leave_from, leave_to, reason, class_teacher } = req.body;

  if (!student_id || !student_name || !leave_from || !leave_to || !reason || !class_teacher) {
      return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
      const newLeaveRequest = await db.query(
          `INSERT INTO leave_requests (student_id, student_name, leave_from, leave_to, reason, teacher_name)
          VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [student_id, student_name, leave_from, leave_to, reason, class_teacher]
      );
      res.status(201).json(newLeaveRequest.rows[0]);
  } catch (error) {
      console.error('Error adding new leave request:', error);
      res.status(500).json({ message: 'Error adding new leave request' });
  }
});

// Update an existing leave request
app.put('/leave-requests1/:id', async (req, res) => {
  const { id } = req.params;
  const { leave_from, leave_to, reason, status, teacher_name } = req.body;

  try {
      const updateLeaveRequest = await db.query(
          `UPDATE leave_requests SET leave_from = $1, leave_to = $2, reason = $3, status = $4, teacher_name = $5
          WHERE id = $6 RETURNING *`,
          [leave_from, leave_to, reason, status, teacher_name, id]
      );

      if (updateLeaveRequest.rowCount === 0) {
          return res.status(404).json({ message: 'Leave request not found' });
      }

      res.json(updateLeaveRequest.rows[0]);
  } catch (error) {
      console.error('Error updating leave request:', error);
      res.status(500).json({ message: 'Error updating leave request' });
  }
});

// Delete a leave request
app.delete('/leave-requests1/:id', async (req, res) => {
  const { id } = req.params;

  try {
      const deleteLeaveRequest = await db.query(
          'DELETE FROM leave_requests WHERE id = $1 RETURNING *',
          [id]
      );

      if (deleteLeaveRequest.rowCount === 0) {
          return res.status(404).json({ message: 'Leave request not found' });
      }

      res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
      console.error('Error deleting leave request:', error);
      res.status(500).json({ message: 'Error deleting leave request' });
  }
});








// Fetch student by ID
app.get('/student/:id', async (req, res) => {
  const { id } = req.params;
  try {
      const student = await db.query('SELECT * FROM student_register WHERE student_id = $1', [id]);
      if (student.rows.length === 0) {
          return res.status(404).json({ message: 'Student not found' });
      }
      res.json(student.rows[0]);
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
  }
});

// Add a new student
 app.post('/student', async (req, res) => {
  const {
      full_name, class: studentClass, section, contact, password, guardian_name,
      emergency_contact, address, blood_group, father_name, mother_name, gender,
      date_of_birth, role,
  } = req.body;

  try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newStudent = await db.query(
          `INSERT INTO student_register (full_name, class, section, contact, password, guardian_name, emergency_contact, address, blood_group, father_name, mother_name, gender, date_of_birth, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
          [
              full_name, studentClass, section, contact, hashedPassword, guardian_name,
              emergency_contact, address, blood_group, father_name, mother_name, gender,
              date_of_birth, role,
          ]
      );
      res.json(newStudent.rows[0]);
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
  }
});

/*-----------------------------------------------------------------*/ 

app.get('/assignments', async (req, res) => {
  const { class: className, section } = req.query;

  if (!className || !section) {
      return res.status(400).json({ message: 'Class and section are required as query parameters.' });
  }

  try {
      const query = `
          SELECT *
          FROM add_assignment_std
          WHERE class = $1 AND section = $2
      `;

      const values = [className, section];

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
          return res.status(404).json({ message: 'No assignments found for the specified class and section.' });
      }

      res.status(200).json(result.rows);
  } catch (error) {
      console.error('Error fetching assignments:', error);
      res.status(500).json({ message: 'Failed to fetch assignments from the database.' });
  }
});

app.get('/student', async (req, res) => {
  const parentId = req.query.parentId;

  if (!parentId) {
      return res.status(400).json({ message: 'Parent ID is required' });
  }

  try {
      const result = await db.query(
          'SELECT DISTINCT child_class, child_section FROM parent_register WHERE parent_id = $1',
          [parentId]
      );
      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching student details:', error);
      res.status(500).json({ message: 'Error fetching student details' });
  }
});

// --- -------------------------Communication Endpoints ---------------------------------
 // GET classdata route (existing)
 app.get('/classdata', async (req, res) => {
     try {
         const query = `
             SELECT DISTINCT class_name, subject
             FROM classtimetable
         `;
         const { rows } = await db.query(query);
         res.json(rows);
     } catch (error) {
         console.error("Error fetching classes and subject:", error);
         res.status(500).json({ error: 'Failed to fetch class data' });
     }
 });
 
 // GET teachers route (existing)
 app.get('/teachers/:class_name/:subject', async (req, res) => {
     const { class_name, subject } = req.params;
     try {
         const query = `
             SELECT DISTINCT ct.teacher_name
             FROM classtimetable ct
             WHERE ct.class_name = $1 AND ct.subject = $2
         `;
 
         const { rows } = await db.query(query, [class_name, subject]);
         const teacherNames = rows.map(row => row.teacher_name);
         res.json(teacherNames);
     } catch (error) {
         console.error("Error fetching teachers:", error);
         res.status(500).json({ error: 'Failed to fetch teachers' });
     }
 });
 
 // POST communication route
 app.post('/communication/:parentId/:parentname', async (req, res) => {
     const { parentId, parentname } = req.params;
     const { class: studentClass, subject, teacher_name, message } = req.body; // Get data from req.body
 
     try {
         const newCommunication = await db.query(
             `INSERT INTO communication (role, name, title, description, date, owner_id, owner_name)
              VALUES ('teacher', $1, $2, $3, CURRENT_DATE, $4, $5)
              RETURNING message_id as id, description as message,
              TO_CHAR(date, 'YYYY-MM-DD') as date,
             TO_CHAR(date, 'HH12:MI AM') as time,
             name as teacher_name,
              title as subject`,
             [teacher_name, subject, message, parentId, parentname]
         );
 
         res.status(201).json(newCommunication.rows[0]);
     } catch (error) {
         console.error('Error adding new communication:', error);
         res.status(500).json({ message: 'Error adding new communication' });
     }
 });
 
 // GET communication route (existing, but cleaned up)
 app.get('/communication', async (req, res) => {
     const { class: studentClass, subject, teacher_name } = req.query;
 
     try {
         let query = `
             SELECT  message_id as id, description as message,
                 TO_CHAR(date, 'YYYY-MM-DD') as date,
                TO_CHAR(date, 'HH12:MI AM') as time,
                name as teacher_name,
                 title as subject
             FROM communication
             WHERE role = 'teacher'
         `;
         const values = [];
 
         if (teacher_name) {
             query += ' AND name = $1';
             values.push(teacher_name);
         }
 
         if (subject) {
             query += ' AND title = $2';
             values.push(subject);
         }
       
 
         query += ' ORDER BY date';
 
         const result = await db.query(query, values);
         res.json(result.rows);
     } catch (error) {
         console.error('Error fetching communication:', error);
         res.status(500).json({ message: 'Error fetching communication' });
     }
 });
 
 // DELETE communication route (existing)
 app.delete('/communication/:id', async (req, res) => {
     const { id } = req.params;
 
     try {
         const deleteCommunication = await db.query(
             'DELETE FROM communication WHERE message_id = $1 RETURNING *',
             [id]
         );
 
         if (deleteCommunication.rowCount === 0) {
             return res.status(404).json({ message: 'Communication not found' });
         }
 
         res.json({ message: 'Communication deleted successfully' });
     } catch (error) {
         console.error('Error deleting communication:', error);
         res.status(500).json({ message: 'Error deleting communication' });
     }
 });
 
 
//-----------------------schooll activies/Events-----------------------------------


  // Fetch all school activities
  app.get('/api/event', async (req, res) => {
      try {
        const result = await db.query('SELECT title, start_date, end_date FROM event ORDER BY start_date ASC');
        res.json(result.rows);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
      }
    });
//--------------------Assignments---------------------------------------
// Assignments Endpoints

// Configure multer for file upload
const uploadStorage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, 'uploads/'); // Specify the upload directory
  },
  filename: function(req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); // Generate unique filename
  }
});
const uploadFile = multer({ storage: uploadStorage });

// Endpoint to upload file
app.post('/upload',uploadFile.single('source_file'),(req, res) => {
  if(!req.file) {
      return res.status(400).json({message: 'No file uploaded'});
  }
  res.status(200).json({message: 'File uploaded successfully', file: req.file.filename});
})


//---------------------------------calender---------------------------------------
// Fetch events for the calendar
app.get("/api/event", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, title, start_date, end_date FROM event"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});



// Fetch students
app.get("/api/students", async (req, res) => {
  
  try {
    const result = await db.query("SELECT student_id, full_name FROM student_register");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching students");
  }
});


//----------------------------------------Notification--------------------------------------
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});


// Get all notifications
app.get('/api/notification', async (req, res) => {
  try {
        const result = await db.query('SELECT * FROM notification ORDER BY date DESC');
        res.json(result.rows);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).send({ message: 'Error fetching notifications' });
  }
}); 

app.get('/api/notification/unread', async (req, res) => {
  try {
      const query = 'SELECT * FROM notification WHERE read = false';
      const result = await db.query(query);
      res.json(result.rows); // Send all unread notifications as a response
  } catch (err) {
      console.error("Failed to fetch unread notifications:", err);
      res.status(500).send('Error fetching unread notifications');
  }
});
// Create a new notification
app.post('/api/notification', async (req, res) => {
  const { role, title, description } = req.body;
  if (!role || !title || !description) {
    return res.status(400).send({ message: 'Role, title and description are required' });
  }
  try {
    const result = await db.query(
      'INSERT INTO notification (role, title, description) VALUES ($1, $2, $3) RETURNING *',
      [role, title, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).send({ message: 'Error creating notification' });
  }
});

// Update notification as read
app.put('/api/notification/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('UPDATE notification SET read = true WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
          return res.status(404).send({ message: 'Notification not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating notification:", error);
        res.status(500).send({ message: 'Error updating notification' });
    }
});

/*-------------------------------------------------------------------------------------*/ 


  // Update parent profile
app.put('/api/parent/profile', async (req, res, next) => {
  const {
      parent_id,
      full_name,
      contact,
      email,
      relationship,
      password,
      child_name,
      child_class,
      child_section,
      address,
      role,
      student_id,

  } = req.body;

  console.log("Received Update Request Body:", req.body); // Crucial logging

  // More detailed validation and logging

  if (!full_name) {
      console.error("Error: full_name is missing.");
      return res.status(400).json({ message: "full_name is required." });
  }
  if (!contact) {
      console.error("Error: phone is missing.");
      return res.status(400).json({ message: "contact is required." });
  }
  if (!email) {
      console.error("Error: email is missing.");
      return res.status(400).json({ message: "email is required." });
  }
  if (!relationship) {
      console.error("Error: relationship is missing.");
      return res.status(400).json({ message: "relationship is required." });
  }
  if (!password) {
      console.error("Error: password is missing.");
      return res.status(400).json({ message: "password is required." });
  }
  if (!child_name) {
      console.error("Error: child_name is missing.");
      return res.status(400).json({ message: "child_name is required." });
  }
  if (!child_class) {
      console.error("Error: child_class is missing.");
      return res.status(400).json({ message: "child_class is required." });
  }
  if (!child_section) {
      console.error("Error: child_section is missing.");
      return res.status(400).json({ message: "child_section is required." });
  }
  if (!address) {
      console.error("Error: address is missing.");
      return res.status(400).json({ message: "address is required." });
  }
  if (!role) {
      console.error("Error: role is missing.");
      return res.status(400).json({ message: "role is required." });
  }
  if (!student_id) {
      console.error("Error: student_id is missing.");
      return res.status(400).json({ message: "student_id is required." });
  }
  // Check for empty strings
  if (


      !full_name.trim() ||
      !contact.trim() ||
      !email.trim() ||
      !relationship.trim() ||
      !password.trim() ||
      !child_name.trim() ||
      !child_class.trim() ||
      !child_section.trim() ||
      !address.trim() ||
      !role.trim() ||
      !student_id.trim()
  ) {
      console.error("Error: One or more required fields are empty strings.");
      return res.status(400).json({ message: "All fields are required and must not be empty." });
  }
  try {
      //  Removed bcrypt hashing
      const query = `
          UPDATE parent_register
          SET full_name = $1, contact = $2, email = $3, relationship = $4,
          password = $5, child_name = $6, child_class = $7, child_section = $8,
          address = $9, role = $10, student_id = $11
          WHERE parent_id = $12
      `;
      await db.query(query,
          [full_name, contact, email, relationship, password, child_name, child_class, child_section, address, role, student_id, parent_id]
      );

      res.status(200).json({ message: 'Parent profile updated successfully!' });
  } catch (error) {
      console.error('Error updating parent profile:', error);
      res.status(500).json({ message: 'Error updating parent profile' });
      next(error);
  }
});

// Get parent profile by id
app.get('/api/parent/profileById/:id', async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
      return res.status(400).json({ message: "ID is required" });
  }

  try {
      const result = await db.query(
          'SELECT parent_id, full_name, contact, email, relationship, password, child_name, child_class, child_section, address, role, student_id, Photo FROM parent_register WHERE parent_id = $1',
          [id]
      );
      if (result.rows.length === 0) {
          return res.status(404).json({ message: "Parent not found" });
      }
      res.status(200).json(result.rows[0]);
  } catch (error) {
      console.error("Error fetching parent profile:", error);
      res.status(500).json({ message: "Error fetching parent profile" });
      next(error);
  }
});




// ----------------------- Fee Structure Endpoints ----------------------------------

//Get student fee against parents id
app.get("/api/studentfee", async (req, res) => {
  const parentId = req.query.parentId;
  try {
    const result = await db.query(
      "SELECT  child_name,student_id FROM parent_register where parent_id = $1",[parentId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
// Get all fee structures
app.get('/fee-structures', async (req, res) => {
try {
    const result = await db.query('SELECT * FROM fee_structure');
    res.json(result.rows);
} catch (error) {
    console.error('Error fetching fee structures:', error);
    res.status(500).json({ message: 'Error fetching fee structures' });
}
});

// Add a new fee structure (example for admin)
app.post('/fee-structures', async (req, res) => {
const { class_name, tuition_fee, registration_fee, books_fee, uniform_fee, transportation_fee } = req.body;
try {
    const newFeeStructure = await db.query(
        `INSERT INTO fee_structure (class_name, tuition_fee, registration_fee, books_fee, uniform_fee, transportation_fee) 
   VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [class_name, tuition_fee, registration_fee, books_fee, uniform_fee, transportation_fee]
    );
    res.status(201).json(newFeeStructure.rows[0]);
} catch (error) {
    console.error('Error adding new fee structure:', error);
    res.status(500).json({ message: 'Error adding new fee structure' });
}
});

// Update an existing fee structure by ID
app.put('/fee-structures/:id', async (req, res) => {
const { id } = req.params;
const { class_name, tuition_fee, registration_fee, books_fee, uniform_fee, transportation_fee } = req.body;

try {
    const updateFeeStructure = await db.query(
        `UPDATE fee_structure SET class_name = $1, tuition_fee = $2, registration_fee = $3, books_fee = $4, uniform_fee = $5, transportation_fee = $6 WHERE id = $7 RETURNING *`,
        [class_name, tuition_fee, registration_fee, books_fee, uniform_fee, transportation_fee, id]
    );

    if (updateFeeStructure.rowCount === 0) {
        return res.status(404).json({ message: 'Fee structure not found' });
    }

    res.json(updateFeeStructure.rows[0]);
} catch (error) {
    console.error('Error updating fee structure:', error);
    res.status(500).json({ message: 'Error updating fee structure' });
}
});

// Delete a fee structure by ID
app.delete('/fee-structures/:id', async (req, res) => {
const { id } = req.params;

try {
    const deleteFeeStructure = await db.query('DELETE FROM fee_structure WHERE id = $1 RETURNING *', [id]);

    if (deleteFeeStructure.rowCount === 0) {
        return res.status(404).json({ message: 'Fee structure not found' });
    }

    res.json({ message: 'Fee structure deleted successfully' });
} catch (error) {
    console.error('Error deleting fee structure:', error);
    res.status(500).json({ message: 'Error deleting fee structure' });
}
});







// -------------- Fees History Endpoints ----------------------------------------

// Get all fees history records
app.get('/fees-history', async (req, res) => {
  try {
      const result = await db.query('SELECT * FROM fees_history');
      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching fees history:', error);
      res.status(500).json({ message: 'Error fetching fees history' });
  }
});
// Get fees history for a specific student
app.get('/fees-history/:student_id', async (req, res) => {
  const { student_id } = req.params;

  try {
      const result = await db.query('SELECT * FROM fees_history WHERE student_id = $1', [student_id]);
      if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Fees history not found for this student' });
      }
      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching fees history:', error);
      res.status(500).json({ message: 'Error fetching fees history' });
  }
});
// Add a new fees history record
app.post('/fees-history', async (req, res) => {
  const { student_id, name, class: studentClass, section, total_fee, paid_fee, due_fee, payment_mode, payment_link, is_due } = req.body;

  try {
      const newFeesHistory = await db.query(
          `INSERT INTO fees_history (student_id, name, class, section, total_fee, paid_fee, due_fee, payment_mode, payment_link, is_due)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [student_id, name, studentClass, section, total_fee, paid_fee, due_fee, payment_mode, payment_link, is_due]
      );
      res.status(201).json(newFeesHistory.rows[0]);
  } catch (error) {
      console.error('Error adding new fees history:', error);
      res.status(500).json({ message: 'Error adding new fees history' });
  }
});
// Update an existing fees history record
app.put('/fees-history/:student_id/:payment_id', async (req, res) => {
  const { student_id, payment_id } = req.params;
  const { total_fee, paid_fee, due_fee, payment_mode, payment_link, is_due } = req.body;

  try {
      const updateFeesHistory = await db.query(
          `UPDATE fees_history SET total_fee = $1, paid_fee = $2, due_fee = $3, payment_mode = $4, payment_link = $5, is_due = $6
           WHERE student_id = $7 AND payment_id = $8 RETURNING *`,
          [total_fee, paid_fee, due_fee, payment_mode, payment_link, is_due, student_id, payment_id]
      );

      if (updateFeesHistory.rowCount === 0) {
          return res.status(404).json({ message: 'Fees history record not found' });
      }

      res.json(updateFeesHistory.rows[0]);
  } catch (error) {
      console.error('Error updating fees history:', error);
      res.status(500).json({ message: 'Error updating fees history' });
  }
});
// Delete a fees history record
app.delete('/fees-history/:student_id/:payment_id', async (req, res) => {
  const { student_id, payment_id } = req.params;

  try {
      const deleteFeesHistory = await db.query(
          'DELETE FROM fees_history WHERE student_id = $1 AND payment_id = $2 RETURNING *',
          [student_id, payment_id]
      );

      if (deleteFeesHistory.rowCount === 0) {
          return res.status(404).json({ message: 'Fees history record not found' });
      }

      res.json({ message: 'Fees history record deleted successfully' });
  } catch (error) {
      console.error('Error deleting fees history:', error);
      res.status(500).json({ message: 'Error deleting fees history' });
  }
});

//----------------------------------------Marks Report---------------------------------------------------------------------

// API to fetch the list of students
// Ensure you have the correct database connection setup (db object)
  
app.get("/api/studentm", async (req, res) => {
  const parentId = req.query.parentId;
  console.log("parent ID", parentId)
  try {
    // Query to fetch unique student names from the marks_reports table
    const query = `
      SELECT DISTINCT student_name
      FROM marks_reports
      WHERE parent_id = $1;
    `;
    const result = await db.query(query, [parentId]);

    // Send the list of student names as a response
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).send("Internal server error");
  }
});

app.get("/api/class1", async (req, res) => {
    const parentId = req.query.parentId;
  try {
    const result = await db.query("SELECT DISTINCT class FROM marks_reports where parent_id = $1",[parentId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/api/examtypes", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT DISTINCT exam_type FROM marks_reports"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching exam types:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/api/marksreports", async (req, res) => {
  const { studentName, className, examType } = req.query;

  if (!studentName || !className || !examType) {
    return res.status(400).json({ error: "Missing query parameters" })
  }
  const query = `
    SELECT subject, marks, total_marks, percentage, status
    FROM marks_reports
    WHERE student_name = $1 AND class = $2 AND exam_type = $3;
  `;

  try {
    const result = await db.query(query, [studentName, className, examType]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching marks report:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
 //-------------------------------------my child-----------------------------
 app.get('/api/children', async (req, res) => {
  const parent_id = req.query.parentId; // Ensure consistency with frontend key

  if (!parent_id) {
    return res.status(400).json({ message: 'Parent ID is required' });
  }

  try {
    const result = await db.query(
      'SELECT student_id, child_name FROM parent_register WHERE parent_id = $1',
      [parent_id]
    );

    res.json(result.rows.map(row => ({ id: row.student_id, full_name: row.child_name })));
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get child details by childId
app.get('/api/children/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('SELECT * FROM student_register WHERE student_id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Child not found' });
        }

        const child = result.rows[0];
        res.json({
            id: child.student_id,
            full_name: child.full_name,
            class: child.class,
            section: child.section,
            contact: child.contact,
            guardian_name: child.guardian_name,
            address: child.address,
            blood_group: child.blood_group,
            photo: child.photo,  // Return the photo path
            father_name: child.father_name,
            mother_name: child.mother_name,
            emergency_contact: child.emergency_contact,
            gender: child.gender,
            role: child.role,
            date_of_birth: child.date_of_birth.toISOString().split('T')[0],
            email: child.email,
            student_roll_number: child.student_roll_number,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

//---------------------------attadance----------------------------------------------

// Attendance
// Fetch all students
 app.get("/api/student5", async (req, res) => {
  const parentId = req.query.parentId;
  try {
    const result = await db.query(
      "SELECT student_id, child_name, child_class, child_section FROM parent_register where parent_id = $1",[parentId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Fetch attendance based on full_name, class, section, and student_roll_number
app.get("/attendance", async (req, res) => {
  const { full_name, class: className, section, student_id } = req.query;

  try {
    const result = await db.query(
      "SELECT date, status FROM student_attendance WHERE student_name = $1 AND class = $2 AND section = $3 AND student_id = $4",
      [full_name, className, section, student_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

//---------------------Time table--------------------------------------------------------
// Fetch students
app.get("/api/students", async (req, res) => {
  try {
    const result = await db.query("SELECT student_id, full_name FROM student_register");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching students");
  }
});

// ✅ Fetch distinct classes and exam types
app.get("/api/classes-examtypes", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT class_name AS class, exam_type FROM exam_timetable`
    );

    const classes = [...new Set(result.rows.map((row) => row.class))];
    const examTypes = [...new Set(result.rows.map((row) => row.exam_type))];

    res.json({ classes, examTypes });
  } catch (err) {
    console.error("Error fetching classes and exam types:", err);
    res.status(500).send("Error fetching data");
  }
});

// ✅ Fetch exam timetable based on selected class and exam type
app.get("/api/timetable/exam", async (req, res) => {
  const { class: className, examType } = req.query;
  try {
    const result = await db.query(
      `SELECT date, day, time, subject 
       FROM exam_timetable 
       WHERE class_name = $1 AND exam_type = $2`,
      [className, examType]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching exam timetable:", err);
    res.status(500).send("Error fetching exam timetable");
  }
});

// Fetch sections by class
app.get("/api/section/:class_name", async (req, res) => {
  const { class_name } = req.params;
  try {
    const result = await db.query("SELECT DISTINCT section FROM classtimetable WHERE class_name = $1", [class_name]);
    res.json(result.rows.map(row => row.section)); // Ensuring correct mapping
  } catch (error) {
    console.error("Error fetching sections:", error);
    res.status(500).send("Server error");
  }
});
// Fetch classes
app.get("/api/class", async (req, res) => {
  try {
    const result = await db.query("SELECT DISTINCT class_name as class FROM classtimetable");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching classes");
  }
});

// Fetch sections based on class
app.get("/api/section/:className", async (req, res) => {
  const { className } = req.params;
  try {
    const result = await db.query(
      "SELECT DISTINCT section FROM classtimetable WHERE class_name = $1",
      [className]
    );
    res.json(result.rows.map((row) => row.section));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching sections");
  }
});

/// API to fetch timetable based on class and section
app.get("/api/timetable1/:class_name/:section", async (req, res) => {
  const { class_name, section } = req.params;
  try {
    const result = await db.query(
      `SELECT day, subject, teacher_name, TO_CHAR(time, 'HH24:MI') AS time 
       FROM classtimetable 
       WHERE class_name = $1 AND section = $2
       ORDER BY day, time`,
      [class_name, section]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No timetable found." });
    }
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching timetable:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});


//admin portal


// GET: Fetch all admins

app.get('/admins', async (req, res) => {

  try {

    const result = await db.query('SELECT * FROM admin_register');
    console.log(result.rows);
  

    res.status(200).json(result.rows);

  }
  
  catch (error) {

    console.error('Error fetching admins:', error);

    res.status(500).json({ message: 'Error fetching admin_register' });

  }

});


// POST: Create a new admin with photo upload
app.post('/admins', upload.single('photo'), async (req, res) => {
  const { name, email, password, role, contact } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null; // Get the photo path

  try {
    const result = await db.query(
      'INSERT INTO admin_register (name, email, password, role, contact, photo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, password, role, contact, photo] // Include photo in the query
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ message: 'Error creating admin' });
  }
});

// PUT: Update an admin with photo upload
// PUT: Update an admin with photo upload
app.put('/admins/:id', upload.single('photo'), async (req, res) => {
  const { id } = req.params; // Use 'id' to match the URL parameter
  const { name, email, password, role, contact } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null; // Get the photo path

  // Log incoming data for debugging
  console.log('Updating admin with ID:', id);
  console.log('Request body:', req.body);

  try {
    // Check if the admin exists
    const checkAdmin = await db.query('SELECT * FROM admin_register WHERE admin_id = $1', [id]);
    if (checkAdmin.rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Update the admin
    const result = await db.query(
      'UPDATE admin_register SET name = $1, email = $2, password = $3, role = $4, contact = $5, photo = $6 WHERE admin_id = $7 RETURNING *',
      [name, email, password, role, contact, photo, id] // Use 'id' here
    );

    res.status(200).json(result.rows[0]); // Ensure the response includes the updated admin details
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({ message: 'Error updating admin_register' });
  }
});

// DELETE: Delete an admin

app.delete('/admins/:id', async (req, res) => {

  const { admin_id } = req.params;


  try {

    const result = await db.query('DELETE FROM admin_register WHERE admin_id = $1', [admin_id]);


    if (result.rowCount === 0) {

      return res.status(404).json({ message: 'Admin not found' });

    }


    res.status(204).send();

  } catch (error) {

    console.error('Error deleting admin:', error);

    res.status(500).json({ message: 'Error deleting admin' });

  }

});

// Get all leave requests
app.get('/leave', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM teacher_leave');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).send('Server error');
  }
});

// Create a new leave request
app.post('/leave', async (req, res) => {
  const { teacher_id, teacher_name, leave_from, leave_to, reason } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO teacher_leave (teacher_id, name, leave_from, leave_to, reason, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [teacher_id, teacher_name, leave_from, leave_to, reason, 'Pending'] // Initial status is 'Pending'
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).send('Server error');
  }
});

// Update leave request status
app.put('/leave/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // status can be 'Approved' or 'Rejected'

  try {
    const result = await db.query(
      'UPDATE teacher_leave SET status = $1 WHERE teacher_id = $2 RETURNING *', // corrected id to teacher_id
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Leave request not found');
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).send('Server error');
  }
});




// ...................................Get total counts and events backend code.................................................//

app.get('/api/stats', async (req, res) => {
  try {
      const totalStudentsQuery = 'SELECT COUNT(*) AS total FROM student_register';
      const totalTeachersQuery = 'SELECT COUNT(*) AS total FROM teacher_register';
      const totalClassesQuery = `
          SELECT COUNT(DISTINCT class_name) AS total 
          FROM classtimetable
      `;
      const eventsQuery = 'SELECT * FROM event ORDER BY start_date';
      const genderRatioQuery = `
          SELECT gender, COUNT(*) AS count 
          FROM student_register 
          GROUP BY gender
      `;

      const totalStudentsResult = await db.query(totalStudentsQuery);
      const totalTeachersResult = await db.query(totalTeachersQuery);
      const totalClassesResult = await db.query(totalClassesQuery);
      const eventsResult = await db.query(eventsQuery);
      const genderRatioResult = await db.query(genderRatioQuery);

      const totalStudents = totalStudentsResult.rows[0].total;
      const totalTeachers = totalTeachersResult.rows[0].total;
      const totalClasses = totalClassesResult.rows[0].total;
      const events = eventsResult.rows;

      // Prepare gender ratio data
      const genderRatio = {};
      genderRatioResult.rows.forEach(row => {
          genderRatio[row.gender] = row.count;
      });

      res.json({ totalStudents, totalTeachers, totalClasses, events, genderRatio });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});





//....................................students Backend code..........................................//

// Get all students
app.get('/student1', async (req, res) => {
  try {
      const result = await db.query('SELECT * FROM student_register'); // Change table name

      const studentsWithFullPhotoUrl = result.rows.map(student => {
          return {
              ...student,
              photo: student.photo ? `http://localhost:5000/${student.photo}` : null
          };
        
      });

      res.status(200).json(studentsWithFullPhotoUrl);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching students' });
  }
});

// Add a new student
app.post('/student1', upload.single('photo'), async (req, res) => {
  const {
      student_id, // Change from student_roll_number to student_id
      full_name,
      date_of_birth,
      gender,
      role,
      class: className,
      section,
      email,
      contact,
      password,
      father_name,
      mother_name,
      guardian_name,
      emergency_contact,
      address,
      blood_group,
  } = req.body;

  const photoPath = req.file ? req.file.path : null;

  try {
      const result = await db.query(
          'INSERT INTO student_register (student_id, full_name, date_of_birth, gender, role, class, section, email, contact, password, father_name, mother_name, guardian_name, emergency_contact, address, blood_group, photo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *',
          [student_id, full_name, date_of_birth, gender, role, className, section, email, contact, password, father_name, mother_name, guardian_name, emergency_contact, address, blood_group, photoPath]
      );

      res.status(201).json(result.rows[0]);
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});

// Update a student
app.put('/student1/:id', upload.single('photo'), async (req, res) => {
  const { id } = req.params;

  const {
      student_id, // Change from student_roll_number to student_id
      full_name,
      date_of_birth,
      gender,
      role,
      class: className,
      section,
      email,
      contact,
      password,
      father_name,
      mother_name,
      guardian_name,
      emergency_contact,
      address,
      blood_group,
  } = req.body;

  const photoPath = req.file ? req.file.path : null;

  try {
      const result = await db.query(
          'UPDATE student_register SET student_id = $1, full_name = $2, date_of_birth = $3, gender = $4, role = $5, class = $6, section = $7, email = $8, contact = $9, password = $10, father_name = $11, mother_name = $12, guardian_name = $13, emergency_contact = $14, address = $15, blood_group = $16, photo = $17 WHERE id = $18 RETURNING *',
          [student_id, full_name, date_of_birth, gender, role, className, section, email, contact, password, father_name, mother_name, guardian_name, emergency_contact, address, blood_group, photoPath, id]
      );

      res.json(result.rows[0]);
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});

// Delete a student
app.delete('/student1/:id', async (req, res) => {
  const { id } = req.params;

  try {
      await db.query('DELETE FROM student_register WHERE id = $1', [id]); // Change table name
      res.status(204).send();
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});
//....................................teachers Backend code..................................//
app.get('/teacher1', async (req, res) => {
  try {
      const result = await db.query('SELECT * FROM teacher_register'); // Change table name
      res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});

// Add a new teacher
app.post('/teacher1', upload.single('photo'), async (req, res) => {
  const { full_name, subject, gender, date_of_birth, role, contact, password, email, address, experience } = req.body;
  const photo = req.file ? req.file.path : null; // Get the file path from multer
  try {
      const result = await db.query(
          'INSERT INTO teacher_register (full_name, subject, gender, date_of_birth, role, contact, password, email, address, experience, photo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
          [full_name, subject, gender, date_of_birth, role, contact, password, email, address, experience, photo]
      );
      res.json(result.rows[0]);
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});

// Update a teacher
app.put('/teacher1/:teacher_id', upload.single('photo'), async (req, res) => { // Change :id to :teacher_id
  const { teacher_id } = req.params; // Change id to teacher_id
  const { full_name, subject, gender, date_of_birth, role, contact, password, email, address, experience } = req.body;
  const photo = req.file ? req.file.path : null; // Get the file path from multer
  try {
      const result = await db.query(
          'UPDATE teacher_register SET full_name = $1, subject = $2, gender = $3, date_of_birth = $4, role = $5, contact = $6, password = $7, email = $8, address = $9, experience = $10, photo = $11 WHERE teacher_id = $12 RETURNING *', // Change id to teacher_id
          [full_name, subject, gender, date_of_birth, role, contact, password, email, address, experience, photo, teacher_id] // Change id to teacher_id
      );
      res.json(result.rows[0]);
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});

// Delete a teacher
app.delete('/teacher1/:teacher_id', async (req, res) => { // Change :id to :teacher_id
  const { teacher_id } = req.params; // Change id to teacher_id
  try {
      await db.query('DELETE FROM teacher_register WHERE teacher_id = $1', [teacher_id]); // Change id to teacher_id
      res.sendStatus(204);
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});

//.............................schedules backend code...............................//
app.get('/schedule1', async (req, res) => {
  try {
      const result = await db.query('SELECT * FROM schedules');
      res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});

// Add a new schedule
app.post('/schedule1', async (req, res) => {
  const { teacher, day, time, subject, class: cls, section, date } = req.body;
  try {
      const result = await db.query(
          'INSERT INTO schedules (teacher, day, time, subject, class, section, date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [teacher, day, time, subject, cls, section, date]
      );
      res.status(201).json(result.rows[0]);
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});

// Update a schedule
app.put('/schedule1/:id', async (req, res) => {
  const { id } = req.params;
  const { teacher, day, time, subject, class: cls, section, date } = req.body;
  try {
      const result = await db.query(
          'UPDATE schedules SET teacher = $1, day = $2, time = $3, subject = $4, class = $5, section = $6, date = $7 WHERE id = $8 RETURNING *',
          [teacher, day, time, subject, cls, section, date, id]
      );
      res.json(result.rows[0]);
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});

// Delete a schedule
app.delete('/schedule1/:id', async (req, res) => {
  const { id } = req.params;
  try {
      await db.query('DELETE FROM schedules WHERE id = $1', [id]);
      res.status(204).send();
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});

//........................activities Bcakend code .............................//
app.get('/activities', async (req, res) => {
  try {
      const result = await db.query('SELECT * FROM activities');
      
      res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});

// Add a new activity
app.post('/activities', async (req, res) => {
  const { title, teacher_id, teacher_name, class: className, section, date, time } = req.body;
  try {
      const result = await db.query(
          'INSERT INTO activities (title, teacher_id, teacher_name, class, section, date, time) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [title, teacher_id, teacher_name, className, section, date, time]
      );
      res.status(201).json(result.rows[0]);
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});

// Update an activity
app.put('/activities/:id', async (req, res) => {
  const { id } = req.params;
  const { title, teacher_id, teacher_name, class: className, section, date, time } = req.body;
  try {
      const result = await db.query(
          'UPDATE activities SET title = $1, teacher_id = $2, teacher_name = $3, class = $4, section = $5, date = $6, time = $7 WHERE id = $8 RETURNING *',
          [title, teacher_id, teacher_name, className, section, date, time, id]
      );
      res.json(result.rows[0]);
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});

// Delete an activity
app.delete('/activities/:id', async (req, res) => {
  const { id } = req.params;
  try {
      await db.query('DELETE FROM activities WHERE id = $1', [id]);
      res.status(204).send();
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});



// .....................parents Backend Code ...........................//
 app.get('/parents', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM parent_register'); // Change table name
    const parentsWithFullPhotoUrl = result.rows.map(parent => {
      return {
        ...parent,
        photo: parent.photo ? `http://localhost:5000/${parent.photo}` : null // Construct full URL for the photo
      };
    });
    res.status(200).json(parentsWithFullPhotoUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching parents' });
  }
});

// Add a new parent
app.post('/parents', upload.single('photo'), async (req, res) => {
  const {
    full_name,
    phone,
    email,
    relationship,
    password,
    child_name,
    child_class,
    child_section,
    address,
    role,
  } = req.body;

  const photoPath = req.file ? req.file.path : null; // Get the file path

  try {
    const result = await db.query(
      `INSERT INTO parent_register (full_name,contact, email, relationship, password, child_name, child_class, child_section, address, role, photo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING parent_id`, // Change id to parent_id
      [full_name, phone, email, relationship, password, child_name, child_class, child_section, address, role, photoPath]
    );
    res.status(201).json({ parentId: result.rows[0].parent_id }); // Change id to parent_id
  } catch (error) {
    console.error('Error adding parent:', error);
    res.status(500).json({ message: 'Error adding parent' });
  }
});

// Update a parent
app.put('/parents/:parent_id', upload.single('photo'), async (req, res) => { // Change :id to :parent_id
  const { parent_id } = req.params; // Change id to parent_id
  const {
    full_name,
    phone,
    email,
    relationship,
    password,
    child_name,
    child_class,
    child_section,
    address,
    role,
  } = req.body;

  const photoPath = req.file ? req.file.path : null; // Get the file path

  try {
    await db.query(
      `UPDATE parent_register SET full_name = $1, contact = $2, email = $3, relationship = $4, password = $5, child_name = $6, child_class = $7, child_section = $8, address = $9, role = $10, photo = $11 WHERE parent_id = $12`, // Change id to parent_id
      [full_name, phone, email, relationship, password, child_name, child_class, child_section, address, role, photoPath, parent_id] // Change id to parent_id
    );
    res.status(200).json({ message: 'Parent updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating parent' });
  }
});

// Delete a parent
app.delete('/parents/:parent_id', async (req, res) => { // Change :id to :parent_id
  const { parent_id } = req.params; // Change id to parent_id
  try {
    await db.query('DELETE FROM parent_register WHERE parent_id = $1', [parent_id]); // Change id to parent_id
    res.status(200).json({ message: 'Parent deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting parent' });
  }
});
// ............................Classes Backend code.......................//
app.get('/class', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM classtimetable'); // Change table name
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).send('Server error');
  }
});

// Add a new class
app.post('/class', async (req, res) => {
  const { class_name, section, subject, teacher_name, teacher_id, day, time } = req.body; // Change subject_name and section_name
  try {
    const result = await db.query(
      'INSERT INTO classtimetable (class_name, section, subject, teacher_name, teacher_id, day, time) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [class_name, section, subject, teacher_name, teacher_id, day, time]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding class:', error);
    res.status(500).send('Server error');
  }
});

// Update a class
app.put('/class/:id', async (req, res) => {
  const { id } = req.params;
  const { class_name, section, subject, teacher_name, teacher_id, day, time } = req.body; // Change subject_name and section_name
  try {
    await db.query(
      'UPDATE classtimetable SET class_name = $1, section = $2, subject = $3, teacher_name = $4, teacher_id = $5, day = $6, time = $7 WHERE id = $8',
      [class_name, section, subject, teacher_name, teacher_id, day, time, id]
    );
    res.sendStatus(204);
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).send('Server error');
  }
});

// Delete a class
app.delete('/class/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM classtimetable WHERE id = $1', [id]); // Change table name
    res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).send('Server error');
  }
});


// ....................Exams Backend code....................//

app.get('/exams', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM exam_timetable');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).send('Server error');
  }
});

app.post('/exams', async (req, res) => {
  const { exam_type, class_name, section, subject, date, time, day } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO exam_timetable (exam_type, class_name, section, subject, date, time, day) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [exam_type, class_name, section, subject, date, time, day]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding exam:', error);
    res.status(500).send('Server error');
  }
});

app.put('/exams/:id', async (req, res) => {
  const { id } = req.params;
  const { exam_type, class_name, section, subject, date, time, day } = req.body;
  try {
    await db.query(
      'UPDATE exam_timetable SET exam_type = $1, class_name = $2, section = $3, subject = $4, date = $5, time = $6, day = $7 WHERE id = $8',
      [exam_type, class_name, section, subject, date, time, day, id]
    );
    res.sendStatus(204);
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).send('Server error');
  }
});

app.delete('/exams/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM exam_timetable WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).send('Server error');
  }
});

// Get all students with their total fee
app.get('/student4', async (req, res) => {
  try {
      const result = await db.query(`
          SELECT 
              s.id AS student_id,
              s.full_name,
              s.class,
              s.section,
              COALESCE(fs.tuition_fee, 0) + COALESCE(fs.registration_fee, 0) + COALESCE(fs.books_fee, 0) + COALESCE(fs.uniform_fee, 0) + COALESCE(fs.transportation_fee, 0) AS total_fee,
              COALESCE(p.paid_fee, 0) AS paid_fee,
              COALESCE(p.due_fee, 0) AS due_fee,
              COALESCE(p.payment_mode, '') AS payment_mode,
              p.payment_date,
              COALESCE(p.status, 'Pending') AS status
          FROM student_register s
          LEFT JOIN fee_structure fs ON s.class = fs.class_name
          LEFT JOIN (
              SELECT student_id, 
                     SUM(paid_fee) AS paid_fee,
                     SUM(due_fee) AS due_fee,
                     payment_mode,
                     MAX(payment_date) AS payment_date,
                     status
              FROM payments
              GROUP BY student_id, payment_mode, status  -- Group by all non-aggregated columns
          ) p ON s.id = p.student_id;
      `);
      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ error: 'Failed to fetch students' });
  }
});


// Get fee structure
app.get('/feestructure', async (req, res) => {
  try {
      const result = await db.query('SELECT * FROM fee_structure');
      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching fee structure:', error);
      res.status(500).json({ error: 'Failed to fetch fee structure' });
  }
});

// Handle payment
app.post('/payments', async (req, res) => {
  const { studentId, paidFee, dueFee, paymentMode } = req.body;

  try {
      // Insert into payments table
      const insertQuery = `
          INSERT INTO payments (student_id, total_fee, paid_fee, due_fee, payment_mode, payment_date, status)
          SELECT $1, fs.tuition_fee + fs.registration_fee + fs.books_fee + fs.uniform_fee + fs.transportation_fee, $2, $3, $4, NOW(), CASE WHEN $3 = 0 THEN 'Paid' ELSE 'Pending' END
          FROM fee_structure fs
          JOIN student_register s ON s.class = fs.class_name
          WHERE s.id = $1;
      `;
      await db.query(insertQuery, [studentId, paidFee, dueFee, paymentMode]);

      res.status(200).json({ message: 'Payment processed successfully' });
  } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({ error: 'Failed to process payment' });
  }
});

//................ fee structures Backend Code......................//

app.get('/fee-structure', async (req, res) => {

  try {

      const result = await db.query('SELECT * FROM fee_structure');

      res.json(result.rows);

  } catch (err) {

      console.error(err);

      res.status(500).send('Server error');

  }

});


// Update a fee structure

app.put('/fee-structure/:id', async (req, res) => {

  const { id } = req.params;

  const { class_name, tuition_fee, registration_fee, books_fee, uniform_fee, transportation_fee } = req.body;


  try {

      const result = await db.query(

          'UPDATE fee_structure SET class_name = $1, tuition_fee = $2, registration_fee = $3, books_fee = $4, uniform_fee = $5, transportation_fee = $6 WHERE id = $7 RETURNING *',

          [class_name, tuition_fee, registration_fee, books_fee, uniform_fee, transportation_fee, id]

      );


      if (result.rows.length === 0) {

          return res.status(404).send('Fee structure not found');

      }


      res.json(result.rows[0]);

  } catch (err) {

      console.error(err);

      res.status(500).send('Server error');

  }

});




// ....................Events Backend Code....................//

app.get('/event', async (req, res) => {
  const result = await db.query('SELECT * FROM event');
  
  
  res.json(result.rows);
});

// Add a new event
app.post('/event', async (req, res) => {
  const { title, start_time, end_time } = req.body;
  const result = await db.query('INSERT INTO event (title, start_date, end_date) VALUES ($1, $2, $3) RETURNING *', [title, start_time, end_time]);
  res.json(result.rows[0]);
});

// Update an event
app.put('/event/:id', async (req, res) => {
  const { id } = req.params;
  const { title, start_time, end_time } = req.body;
  const result = await db.query('UPDATE event SET title = $1, start_date = $2, end_date = $3 WHERE id = $4 RETURNING *', [title, start_time, end_time, id]);
  res.json(result.rows[0]);
});

// Delete an event
app.delete('/event/:id', async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM event WHERE id = $1', [id]);
  res.sendStatus(204);
});


// Routes
// Routes
// Get all books

app.get('/books', async (req, res) => {

  try {

    const result = await db.query('SELECT * FROM books');

    res.json(result.rows);

  } catch (error) {

    console.error('Error fetching books:', error);

    res.status(500).json({ error: 'Internal Server Error' });

  }

});


// Add a new book

app.post('/books', async (req, res) => {

  const { title, author, number_of_books } = req.body;


  if (!title || !author || number_of_books === undefined || number_of_books < 1) {

    return res.status(400).json({ error: 'Title, author, and a positive number of books are required.' });

  }


  try {

    const result = await db.query('INSERT INTO books (title, author, number_of_books) VALUES ($1, $2, $3) RETURNING *', [title, author, number_of_books]);

    res.json(result.rows[0]);

  } catch (error) {

    console.error('Error adding book:', error);

    res.status(500).json({ error: 'Internal Server Error' });

  }

});





// Issue a book

app.post('/books/issue/:id', async (req, res) => {

  const { id } = req.params;

  const { studentName, studentId, class: studentClass, section, dueDate } = req.body;


  try {

    const result = await db.query('UPDATE books SET number_of_books = number_of_books - 1, issued_to = issued_to || $1 WHERE id = $2 RETURNING *', 

      [JSON.stringify([{ studentName, studentId, studentClass, section, dueDate }]), id]);

    res.json(result.rows[0]);

  } catch (error) {

    console.error('Error issuing book:', error);

    res.status(500).json({ error: 'Internal Server Error' });

  }

});


// Return a book

app.post('/books/return/:id', async (req, res) => {

  const { id } = req.params;

  const { studentId } = req.body;


  try {

    const bookResult = await db.query('SELECT * FROM books WHERE id = $1', [id]);

    const book = bookResult.rows[0];


    const issuedTo = book.issued_to.find(student => student.studentId === studentId);

    if (issuedTo) {
      const fine = calculateFine(issuedTo.dueDate);
      const updatedIssuedTo = book.issued_to.filter(student => student.studentId !== studentId);

      const result = await db.query('UPDATE books SET number_of_books = number_of_books + 1, issued_to = $1 WHERE id = $2 RETURNING *', 
        [JSON.stringify(updatedIssuedTo), id]);

      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    console.error('Error returning book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.put('/books/:id', async (req, res) => {
  const { id } = req.params;
  const { title, author, number_of_books } = req.body;

  // Validate input
  if (!title || !author || number_of_books === undefined || number_of_books < 0) {
    return res.status(400).json({ error: 'Title, author, and a non-negative number of books are required.' });
  }

  try {
    const result = await db.query('UPDATE books SET title = $1, author = $2, number_of_books = $3 WHERE id = $4 RETURNING *', [title, author, number_of_books, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a book
app.delete('/books/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM books WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ message: 'Book deleted' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Calculate fine based on overdue days
const calculateFine = (dueDate) => {
  if (!dueDate) return 0;
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today - due;
  const overdueDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
  return overdueDays * 50; // ₹50 per overdue day
};


app.get('/admin2/:id', async (req, res) => {
  const adminId = req.params.id;
  try {
    const result = await db.query('SELECT * FROM admin_register WHERE admin_id = $1', [adminId]);

    if (result.rows.length > 0) {
      const admin = result.rows[0];
      res.json(admin);
    } else {
      res.status(404).send('Admin not found');
    }
  } catch (error) {
    console.error('Error fetching admin data:', error);
    res.status(500).send('Server error');
  }
});

app.put('/admin2/:id', upload.single('photo'), async (req, res) => {
    const adminId = req.params.id;
    const { name, role, email, contact, password } = req.body;
    let photo = null;

    try {
        if (req.file) {
            photo = 'uploads/' + req.file.filename;  // Correctly store the path
        }

        let query = 'UPDATE admin_register SET name = $1, role = $2, email = $3, contact = $4, password = $5';
        const values = [name, role, email, contact, password];

        if (photo) {
            query += ', photo = $6';
            values.push(photo);
        }

        query += ' WHERE admin_id = $7 RETURNING *';
        values.push(adminId);

        const result = await db.query(query, values);

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).send('Admin not found');
        }
    } catch (error) {
        console.error('Error updating admin data:', error);
        res.status(500).send('Server error');
    }
});

// API Endpoint for Attendance Data
app.get('/api/attendance2', async (req, res) => {
  try {
      const { searchTerm = '', page = 1, limit = 5 } = req.query;  // Default values
      const offset = (page - 1) * limit;

      // Construct the SQL query with filtering, pagination, and total count
      let query = `
          SELECT 
              id,
              date,
              teacher_id,
              teacher_name,
              student_id,
              student_name,
              status,
              time,
              class,
              section
          FROM student_attendance
          WHERE
              LOWER(student_name) LIKE $1 OR
              LOWER(class) LIKE $1 OR
              LOWER(section) LIKE $1
          ORDER BY date DESC
          LIMIT $2 OFFSET $3;
      `;
    //  const queryParams = [`%${searchTerm.toLowerCase()}%`, parseInt(limit), parseInt(offset)];
    const queryParams = [`%${searchTerm.toLowerCase()}%`, parseInt(limit), parseInt(offset)];

      const countQuery = `SELECT COUNT(*) FROM student_attendance WHERE
      LOWER(student_name) LIKE $1 OR
      LOWER(class) LIKE $1 OR
      LOWER(section) LIKE $1
    `;
      const countQueryParams = [`%${searchTerm.toLowerCase()}%`];

      // Execute the query
      const result = await db.query(query, queryParams);
      const countResult = await db.query(countQuery, countQueryParams);
      const totalCount = parseInt(countResult.rows[0].count);

      // Send the data and total count as a response
      res.json({
          attendanceData: result.rows,
          totalCount: totalCount,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
      });

  } catch (error) {
      console.error('Error fetching attendance data:', error);
      res.status(500).json({ error: 'Failed to fetch attendance data' });
  }
});






// GET all leave requests

// Fetch leave requests
app.get('/leave-requests3', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM teacher_leave WHERE status = $1', ['Pending']);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).send('Server error');
  }
});

// Approve leave request
app.put('/leave-requests3/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE teacher_leave SET status = $1 WHERE teacher_id = $2', ['Approved', id]);
    res.sendStatus(204);
  } catch (error) {
    console.error('Error approving leave request:', error);
    res.status(500).send('Server error');
  }
});

// Reject leave request
app.put('/leave-requests3/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE teacher_leave SET status = $1 WHERE teacher_id = $2', ['Rejected', id]);
    res.sendStatus(204);
  } catch (error) {
    console.error('Error rejecting leave request:', error);
    res.status(500).send('Server error');
  }
});
// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

