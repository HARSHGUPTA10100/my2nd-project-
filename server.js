const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
var bodyParser = require("body-parser");
var mongoose = require('mongoose');
const path = require('path');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto'); // Importing crypto module for password generation
const app = express();
const port = 4000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

const isProduction = false;
app.use(session({
    secret: 'Mdmak@12345', // Use a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 1000 * 60 * 240  // Session lasts for 30 minutes
    }
}));

// Middleware to prevent caching on protected routes
const preventCache = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
};

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        res.redirect('/login');
    }
};

app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/views"));
app.use(express.static(__dirname + "/admin"));
app.use(express.static(__dirname + "/teacher"));
app.use(express.static(__dirname + "/hod"));
app.use(express.static(__dirname + "/student"));

// MySQL connection
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    port: 3306,
    password: 'admin',
    database: 'school'
});
conn.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Database.');
});

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2');
const db = mongoose.connection;
db.once('open', () => {
    console.log('connected to mongoose');
});

// Notice schema
const userSchema = new mongoose.Schema({
    title: String,
    content: String
});

const Users = mongoose.model('User', userSchema);

// Load signup page
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Notice insert in MongoDB
app.post('/post', async (req, res) => {
    const { title, content } = req.body;
    const user = new Users({ title, content });
    try {
        await user.save();
        console.log("User created");
        res.redirect('/admin.html');
    } catch (error) {
        console.error('Error saving notice:', error);
        res.status(500).send('Error saving notice');
    }
});

// Fetch notice from MongoDB and display in HTML
app.get('/notices', async (req, res) => {
    try {
        const notices = await Users.find({});
        res.json(notices);
    } catch (error) {
        console.error('Error fetching notices:', error);
        res.status(500).send('Error fetching notices');
    }
});

// Delete notice
app.delete('/notices/:id', async (req, res) => {
    try {
        const noticeId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(noticeId)) {
            return res.status(400).send('Invalid ObjectId format');
        }
        const result = await Users.deleteOne({ _id: new mongoose.Types.ObjectId(noticeId) });
        if (result.deletedCount === 0) {
            return res.status(404).send('Notice not found');
        }
        console.log('Delete result:', result);
        res.status(200).send('Notice deleted successfully');
    } catch (error) {
        console.error('Error deleting notice:', error);
        res.status(500).send('Error deleting notice');
    }
});

// Admin login API
app.post('/admin/login', (req, res) => {
    const { email, password } = req.body;

    if (email === 'admin@gmail.com' && password === 'admin') {
        req.session.admin = {
            id: 1,
            name: 'Admin',
            email: 'admin@gmail.com'
        };
        return res.redirect('/admin_dashboard.html');
    } else {
        return res.status(401).json({ error: 'Invalid email or password' });
    }
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'onlinexam01000@gmail.com',
        pass: 'fyiz ulyy swcf dqbv' // Update with your actual password
    }
});

// Function to generate random password
function generateRandomPassword(length) {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
}

// Student registration and send email confirmation (email id and password)
app.post('/add-student', (req, res) => {
    const { name, email, contact, className } = req.body;
    const password = generateRandomPassword(8); // Generate random password of length 8

    const query = `INSERT INTO ${className} (name, email, password, contact) VALUES (?, ?, ?, ?)`;

    conn.query(query, [name, email, password, contact], (err, result) => {
        if (err) {
            console.error('Error inserting student data:', err);
            return res.status(500).send('Error inserting student data');
        }

        // Send email
        const mailOptions = {
            from: 'onlinexam01000@gmail.com',
            to: email,
            subject: 'Student Registration',
            html: `<p>Your registration is successful for class ${className}. Your email: ${email}, Password: ${password}</p>`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).send('Error sending email');
            }
            res.redirect('/admin.html');
        });
    });
});

// Teacher and Hod/principal registration and send email confirmation (email id and password)
app.post('/add-teacher', (req, res) => {
    const { name, email, contact, role } = req.body;
    const password = generateRandomPassword(8); // Generate random password of length 8

    const query = `INSERT INTO ${role} (name, email, password, contact) VALUES (?, ?, ?, ?)`;
    conn.query(query, [name, email, password, contact], (err, result) => {
        if (err) {
            console.error('Error inserting teacher data:', err);
            return res.status(500).send('Error inserting teacher data');
        }

        // Send email
        const mailOptions = {
            from: 'harshgupta88792026@gmail.com',
            to: email,
            subject: 'College Registration',
            html: `<p>Your registration is successful. Your email: ${email}, Password: ${password}</p>`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).send('Error sending email');
            }
            res.redirect('/admin.html');
        });
    });
});

// Get information from MySQL table and display in user-info
app.get('/staff/:department', (req, res) => {
    const department = req.params.department;
    const query = `SELECT * FROM ${department}`;

    conn.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).send('Error fetching data');
        }
        res.json(results);
    });
});

// Hash password function
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Student login route
app.post('/login', (req, res) => {
    const { classe, username, password } = req.body;

    const validClasses = ['tycs', 'sycs', 'fycs', 'fyit', 'syit', 'tyit'];
    if (!validClasses.includes(classe)) {
        return res.status(400).send('Invalid class selection');
    }

    const query = `SELECT * FROM ${classe} WHERE email = ?`;
    conn.query(query, [username], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal server error');
        }

        if (rows.length === 0) {
            return res.status(401).send('Invalid email or password');
        }

        const user = rows[0];

        // Directly compare plain text passwords
        if (user.password !== password) {
            return res.status(401).send('Invalid email or password');
        }

        req.session.user = {
            id: user.name,
            email: user.email,
            number: user.contact || null,
            roll_no: user.roll_no || null,
        };

        res.redirect('/student.html');
    });
});

// Middleware to protect student.html
app.get('/student.html', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }
    res.sendFile(__dirname + '/student.html');
});

// Teacher login
app.post('/teclogin', (req, res) => {
    const { roles, username, password } = req.body;
    let query;

    // Define SQL queries and redirect pages based on roles
    const roleConfig = {
        admin: { query: "SELECT * FROM admin WHERE email = ?", redirect: '/admin.html' },
        hod: { query: "SELECT * FROM hod WHERE email = ?", redirect: '/hod.html' },
        teacher: { query: "SELECT * FROM teacher WHERE email = ?", redirect: '/teacher.html' }
    };

    // Validate role
    const roleData = roleConfig[roles];
    if (!roleData) {
        return res.status(400).send('Invalid role');
    }

    // Execute SQL query
    conn.query(roleData.query, [username], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal server error');
        }

        // Validate user and password
        if (rows.length === 0) {
            return res.status(401).send('Invalid email or password');
        }

        const user = rows[0];
        if (user.password !== password) {
            return res.status(401).send('Invalid email or password');
        }

        // Store user session data
        req.session.user = {
            id: user.name,
            email: user.email,
            number: user.contact || null
        };

        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).send('Internal server error');
            }
            res.redirect(roleData.redirect);
        });
    });
});

// Get user data for frontend
app.get('/getUserData', isAuthenticated, preventCache, (req, res) => {
    res.json(req.session.user);
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send('Error logging out');
        }

        // Prevent caching after logout
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        res.redirect('/login');
    });
});

// Get the total number of teachers
app.get('/teachers/count', (req, res) => {
    conn.query('SELECT COUNT(*) AS total FROM teacher', (error, results) => {
        if (error) throw error;
        res.json({ total: results[0].total });
    });
});

// Get the total number of hod and principal
app.get('/api/hod/count', (req, res) => {
    conn.query('SELECT COUNT(*) AS total FROM hod', (error, results) => {
        if (error) throw error;
        res.json({ total: results[0].total });
    });
});

// Get the total number of students from all tables
app.get('/api/students/count', (req, res) => {
    const query = `
        SELECT 
            IFNULL((SELECT COUNT(*) FROM tycs), 0) AS tycs_count,
            IFNULL((SELECT COUNT(*) FROM sycs), 0) AS sycs_count,
            IFNULL((SELECT COUNT(*) FROM fycs), 0) AS fycs_count,
            IFNULL((SELECT COUNT(*) FROM tyit), 0) AS tyit_count,
            IFNULL((SELECT COUNT(*) FROM syit), 0) AS syit_count,
            IFNULL((SELECT COUNT(*) FROM fyit), 0) AS fyit_count
    `;

    conn.query(query, (error, results) => {
        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const counts = results[0];

        const total = counts.tycs_count + 
                      counts.sycs_count + 
                      counts.fycs_count + 
                      counts.tyit_count + 
                      counts.syit_count + 
                      counts.fyit_count;

        res.json({ 
            tycs: counts.tycs_count,
            sycs: counts.sycs_count,
            fycs: counts.fycs_count,
            tyit: counts.tyit_count,
            syit: counts.syit_count,
            fyit: counts.fyit_count,
            total: total
        });
    });
});

// Theory question insert in theory_questions table
app.post('/add-questions', (req, res) => {
    const { subjectCode, questions } = req.body;

    if (!subjectCode || !Array.isArray(questions)) {
        return res.status(400).send('Invalid input');
    }

    const questionData = questions.map(question => [subjectCode, question]);

    const sql = 'INSERT INTO theory_questions (subject_code, question) VALUES ?';
    conn.query(sql, [questionData], (err, result) => {
        if (err) throw err;
        res.send({ message: 'Questions added successfully', affectedRows: result.affectedRows });
    });
});

// Add subject details for theory subject table
app.post('/add-subject', (req, res) => {
    const { subjectName, Class, totalMarks, examDate, startTime, endTime } = req.body;

    if (!subjectName || !Class || !totalMarks || !examDate || !startTime || !endTime) {
        return res.status(400).send('All fields are required');
    }

    const sql = 'INSERT INTO subjects (subject_name, class, total_marks, exam_date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [subjectName, Class, totalMarks, examDate, startTime, endTime];

    conn.query(sql, values, (err, result) => {
        if (err) throw err;
        res.send({ message: 'Subject added successfully', subjectId: result.insertId });
    });
});

// The latest theory_subject code
app.get('/get-latest-subject-code', (req, res) => {
    const query = 'SELECT subject_code FROM subjects ORDER BY id DESC LIMIT 1';
    conn.query(query, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ subjectCode: result.length > 0 ? result[0].subject_code : null });
    });
});

// Add subject details for mcq subject table
app.post('/add-subjectss', (req, res) => {
    const { subjectName, Class, totalMarks, examDate, startTime, endTime } = req.body;

    if (!subjectName || !Class || !totalMarks || !examDate || !startTime || !endTime) {
        return res.status(400).send('All fields are required');
    }

    const sql = 'INSERT INTO mcq_subjects (subject_name, class, total_marks, exam_date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [subjectName, Class, totalMarks, examDate, startTime, endTime];

    conn.query(sql, values, (err, result) => {
        if (err) throw err;
        res.send({ message: 'Subject added successfully', subjectId: result.insertId });
    });
});

// Fetch the latest mcq_subject code
app.get('/get-latest-subject-codess', (req, res) => {
    const query = 'SELECT subject_code FROM mcq_subjects ORDER BY id DESC LIMIT 1';
    conn.query(query, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ subjectCode: result.length > 0 ? result[0].subject_code : null });
    });
});

// To insert MCQ questions
app.post('/add-mcq', (req, res) => {
    const { subject_code, question, option1, option2, option3, option4, correct_answer } = req.body;
    const query = 'INSERT INTO mcq_questions (subject_code, question, option1, option2, option3, option4, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)';

    conn.query(query, [subject_code, question, option1, option2, option3, option4, correct_answer], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: result.insertId, message: 'MCQ question added successfully.' });
    });
});

// To insert one-line questions
app.post('/add-oneline', (req, res) => {
    const { subject_code, question } = req.body;
    const query = 'INSERT INTO one_line_questions (subject_code, question) VALUES (?, ?)';

    conn.query(query, [subject_code, question], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: result.insertId, message: 'One-line question added successfully.' });
    });
});

// Get subject to show in box 
app.get('/get-subjects', (req, res) => {
    const sql = 'SELECT * FROM mcq_subjects';
    conn.query(sql, (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// Get MCQ questions for a subject
app.get('/get-mcq-questions/:subjectCode', (req, res) => {
    const subjectCode = req.params.subjectCode;
    const sql = 'SELECT * FROM mcq_questions WHERE subject_code = ?';
    conn.query(sql, [subjectCode], (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// Get one-line questions for a subject
app.get('/get-one-line-questions/:subjectCode', (req, res) => {
    const subjectCode = req.params.subjectCode;
    const sql = 'SELECT * FROM one_line_questions WHERE subject_code = ?';
    conn.query(sql, [subjectCode], (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// Route to get all subjects
app.get('/get-subjectss', (req, res) => {
    const query = 'SELECT * FROM subjects';
    conn.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching subjects:', err);
            res.status(500).send('Error fetching subjects');
        } else {
            res.json(results);
        }
    });
});

// Add a new subject
app.post('/add-subject', (req, res) => {
    const { subjectName, Class, totalMarks, examDate, startTime, endTime } = req.body;

    if (!subjectName || !Class || !totalMarks || !examDate || !startTime || !endTime) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = `
        INSERT INTO mcq_subjects 
        (subject_name, class, total_marks, exam_date, start_time, end_time) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [subjectName, Class, totalMarks, examDate, startTime, endTime];

    conn.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error adding subject:', err);
            return res.status(500).json({ error: 'Failed to add subject' });
        }
        res.status(201).json({ message: 'Subject added successfully', subjectId: result.insertId });
    });
});

// Get the latest subject code
app.get('/get-latest-subject-code', (req, res) => {
    const sql = 'SELECT subject_code FROM mcq_subjects ORDER BY id DESC LIMIT 1';
    
    conn.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching latest subject code:', err);
            return res.status(500).json({ error: 'Failed to get latest subject code' });
        }
        res.json({ subjectCode: result.length > 0 ? result[0].subject_code : null });
    });
});

// Add an MCQ question
app.post('/add-mcq', (req, res) => {
    const { subject_code, question, option1, option2, option3, option4, correct_answer } = req.body;

    // Validate input
    if (!subject_code || !question || !option1 || !option2 || !option3 || !option4 || !correct_answer) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if the subject_code exists in mcq_subjects before inserting the question
    const checkSubjectSql = `SELECT * FROM mcq_subjects WHERE subject_code = ?`;

    conn.query(checkSubjectSql, [subject_code], (err, subjectResults) => {
        if (err) {
            console.error('Database error while checking subject:', err);
            return res.status(500).json({ error: 'Database error while checking subject' });
        }

        if (subjectResults.length === 0) {
            return res.status(404).json({ error: `Subject code ${subject_code} not found` });
        }

        // Check if the same question already exists for the subject
        const checkDuplicateSql = `SELECT * FROM mcq_questions WHERE subject_code = ? AND question = ?`;

        conn.query(checkDuplicateSql, [subject_code, question], (err, duplicateResults) => {
            if (err) {
                console.error('Database error while checking duplicate question:', err);
                return res.status(500).json({ error: 'Database error while checking duplicate question' });
            }

            if (duplicateResults.length > 0) {
                return res.status(409).json({ error: 'This question already exists for the given subject' });
            }

            // Insert the new MCQ question
            const insertSql = `
                INSERT INTO mcq_questions 
                (subject_code, question, option1, option2, option3, option4, correct_answer) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            conn.query(insertSql, [subject_code, question, option1, option2, option3, option4, correct_answer], (err, result) => {
                if (err) {
                    console.error('Error adding MCQ:', err);
                    return res.status(500).json({ error: 'Failed to add MCQ question' });
                }

                res.status(201).json({ id: result.insertId, message: 'MCQ question added successfully' });
            });
        });
    });
});

// Get all subjects (from subjects table)
app.get('/get-subjects', (req, res) => {
    const sql = 'SELECT * FROM subjects';
    
    conn.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching subjects:', err);
            return res.status(500).json({ error: 'Failed to fetch subjects' });
        }
        res.json(results);
    });
});

// Get MCQ questions by subject code
app.get('/get-mcq-questions/:subjectCode', (req, res) => {
    const { subjectCode } = req.params;
    
    const sql = 'SELECT * FROM mcq_questions WHERE subject_code = ?';
    conn.query(sql, [subjectCode], (err, result) => {
        if (err) {
            console.error('Error fetching MCQ questions:', err);
            return res.status(500).json({ error: 'Failed to get MCQ questions' });
        }
        res.json(result);
    });
});

// Get one-line questions by subject code
app.get('/get-one-line-questions/:subjectCode', (req, res) => {
    const { subjectCode } = req.params;

    const sql = 'SELECT * FROM one_line_questions WHERE subject_code = ?';
    conn.query(sql, [subjectCode], (err, result) => {
        if (err) {
            console.error('Error fetching one-line questions:', err);
            return res.status(500).json({ error: 'Failed to get one-line questions' });
        }
        res.json(result);
    });
});


// Update marks (internal or external)
app.post('/update-marks', (req, res) => {
    const { roll_no, subject_code, int_marks, ext_marks } = req.body;

    // Check if roll_no, subject_code, and at least one type of marks (internal or external) are provided
    if (!roll_no || !subject_code || (int_marks === undefined && ext_marks === undefined)) {
        return res.status(400).send('Please provide roll_no, subject_code, and either int_marks or ext_marks.');
    }

    // Check if the record exists
    const checkQuery = `SELECT * FROM exam_results WHERE roll_no = ? AND subject_code = ?`;

    conn.query(checkQuery, [roll_no, subject_code], (err, results) => {
        if (err) {
            console.error('Error checking record:', err);
            return res.status(500).send('Internal server error');
        }

        if (results.length === 0) {
            return res.status(404).send('No record found for the given roll_no and subject_code.');
        }

        // Prepare update query based on the provided marks
        let updateQuery = 'UPDATE exam_results SET ';
        let params = [];

        if (int_marks !== undefined) {
            updateQuery += 'int_th_marks = ?';
            params.push(int_marks);
        }

        if (ext_marks !== undefined) {
            if (params.length > 0) updateQuery += ', '; // If updating both, separate with comma
            updateQuery += 'ext_marks = ?';
            params.push(ext_marks);
        }

        // Add the WHERE condition to the query
        updateQuery += ' WHERE roll_no = ? AND subject_code = ?';
        params.push(roll_no, subject_code);

        // Execute the update query
        conn.query(updateQuery, params, (err, result) => {
            if (err) {
                console.error('Error updating marks:', err);
                return res.status(500).send('Failed to update marks');
            }

            if (result.affectedRows === 0) {
                return res.status(400).send('Marks update failed.');
            }

            // Return the teacher page after successful update
            res.sendFile(path.join(__dirname, 'teacher', 'teacher.html'));
        });
    });
});

let examAttempts = {}; // Stores { username: { subject_code: { examStarted: true, examSubmitted: true } } }

app.use(bodyParser.json());

// Endpoint to check if the exam has been started or submitted
app.post('/check-exam-status', (req, res) => {
    const { username, subject_code } = req.body;

    const userExams = examAttempts[username] || {};
    const subjectStatus = userExams[subject_code] || {};

    return res.json({
        examStarted: subjectStatus.examStarted || false,
        examSubmitted: subjectStatus.examSubmitted || false,
    });
});


app.delete('/remove-student/:department/:roll_no', (req, res) => {
    const { department, roll_no } = req.params;

    const allowedDepartments = ['fycs', 'sycs', 'tycs', 'fyit', 'syit', 'tyit', 'teacher', 'hod'];
    if (!allowedDepartments.includes(department.toLowerCase())) {
        return res.status(400).json({ error: 'Invalid department' });
    }

    const sql = `DELETE FROM ${department} WHERE roll_no = ?`;

    db.query(sql, [roll_no], (err, result) => {
        if (err) {
            console.error('Error deleting student:', err);
            return res.status(500).json({ error: 'Failed to delete student' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({ message: 'Student deleted successfully' });
    });
});




app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================== CORS Middleware ========================
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// ======================== Serve Static Folders ========================
app.use('/Internal-answer', express.static(path.join(__dirname, 'Internal-answer')));
app.use('/External-answer', express.static(path.join(__dirname, 'External-answer')));
app.use('/video', express.static(path.join(__dirname, 'video')));

// ======================== PDF Upload Config ========================
// ---- Internal PDF Upload ----
const internalStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'Internal-answer/'),
    filename: (req, file, cb) => cb(null, file.originalname)
});
const uploadInternal = multer({ storage: internalStorage });

app.post('/upload-internal-pdf', uploadInternal.single('pdfFile'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    res.status(200).json({ success: true, message: 'Internal PDF uploaded successfully' });
});

// ---- External PDF Upload ----
const externalStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'External-answer/'),
    filename: (req, file, cb) => cb(null, file.originalname)
});
const uploadExternal = multer({ storage: externalStorage });

app.post('/upload-external-pdf', uploadExternal.single('pdfFile'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    res.status(200).json({ success: true, message: 'External PDF uploaded successfully' });
});

// ======================== Get PDF Files ========================
const internalPdfDir = path.join(__dirname, 'Internal-answer');
const externalPdfDir = path.join(__dirname, 'External-answer');

app.get('/pdfs/internal', (req, res) => {
    fs.readdir(internalPdfDir, (err, files) => {
        if (err) return res.status(500).json({ message: 'Unable to fetch PDFs' });
        res.json(files.filter(file => file.endsWith('.pdf')));
    });
});

app.get('/pdfs/external', (req, res) => {
    fs.readdir(externalPdfDir, (err, files) => {
        if (err) return res.status(500).json({ message: 'Unable to fetch PDFs' });
        res.json(files.filter(file => file.endsWith('.pdf')));
    });
});

// ======================== Delete PDF Files ========================
app.delete('/pdfs/internal/:filename', (req, res) => {
    const filePath = path.join(internalPdfDir, req.params.filename);
    fs.unlink(filePath, err => {
        if (err) return res.status(500).json({ message: 'Error deleting PDF' });
        res.status(200).json({ message: 'Internal PDF deleted successfully' });
    });
});

app.delete('/pdfs/external/:filename', (req, res) => {
    const filePath = path.join(externalPdfDir, req.params.filename);
    fs.unlink(filePath, err => {
        if (err) return res.status(500).json({ message: 'Error deleting PDF' });
        res.status(200).json({ message: 'External PDF deleted successfully' });
    });
});

// ======================== Video Upload Config ========================
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'video/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const uploadVideo = multer({ storage: videoStorage });

app.post('/upload-video', uploadVideo.single('videoFile'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    res.json({ message: 'Video uploaded successfully!', file: req.file.filename });
});

// ======================== Get All Videos ========================
app.get('/get-videos', (req, res) => {
    const videoDir = path.join(__dirname, 'video');
    fs.readdir(videoDir, (err, files) => {
        if (err) return res.status(500).send('Unable to scan video directory');
        const videos = files.map(file => ({
            name: file,
            url: `/video/${file}`
        }));
        res.json(videos);
    });
});

// ======================== Delete Video ========================
app.delete('/delete-video/:name', (req, res) => {
    const filePath = path.join(__dirname, 'video', req.params.name);
    fs.unlink(filePath, err => {
        if (err) return res.status(500).send('Error deleting video');
        res.send('Video deleted successfully');
    });
});

app.post('/auto-submit-exam', (req, res) => {
    const { username, roll_no, class_name, subjectname, subject_code, answers } = req.body;

    const query = `SELECT id, correct_answer FROM mcq_questions WHERE subject_code = ?`;
    
    conn.query(query, [subject_code], (err, results) => {
        if (err) {
            console.error('Error fetching correct answers:', err);
            return res.status(500).send('Error fetching correct answers.');
        }

        let score = 0;

        results.forEach((question, index) => {
            const submittedAnswer = answers[index];
            const correctAnswer = question.correct_answer;

            if (String(submittedAnswer) === String(correctAnswer)) {
                score++;
            }
        });

        const insertQuery = 'INSERT INTO exam_results (username, roll_no, classname, subjectname, subject_code, int_mcq_marks) VALUES (?, ?, ?, ?, ?, ?)';

        conn.query(insertQuery, [username, roll_no, class_name, subjectname, subject_code, score], (err) => {
            if (err) {
                console.error('Error saving auto-submitted score:', err);
                return res.status(500).json({ error: 'Auto submission failed' });
            }

            // Update internal examAttempts status
            if (!examAttempts[username]) {
                examAttempts[username] = {};
            }

            examAttempts[username][subject_code] = {
                examStarted: true,
                examSubmitted: true
            };

            res.json({ message: 'Exam auto-submitted successfully', score });
        });
    });
});

// ======================== Start Server ========================
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

 
