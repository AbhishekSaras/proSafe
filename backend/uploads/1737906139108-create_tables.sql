
--student
CREATE TABLE student_register (
    student_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    class VARCHAR(10) NOT NULL,
    section VARCHAR(5) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    contact VARCHAR(15) NOT NULL,
    password VARCHAR(100) NOT NULL,
    guardian_name VARCHAR(100),
    emergency_contact VARCHAR(15),
    address TEXT,
    blood_group VARCHAR(5),
    photo BYTEA,
    father_name VARCHAR(100),
    mother_name VARCHAR(100),
    gender VARCHAR(10),
    date_of_birth DATE,
    role VARCHAR(50) NOT NULL DEFAULT 'Student'
);
--marks report
CREATE TABLE marks_reports (
    report_id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES student_register(student_id),
    student_name VARCHAR(100) NOT NULL,
    class VARCHAR(10) NOT NULL,
    section VARCHAR(5) NOT NULL,
    parent_id INTEGER REFERENCES parent_register(parent_id),
    parent_name VARCHAR(100) NOT NULL,
    teacher_id INTEGER REFERENCES teacher_register(teacher_id),
    teacher_name VARCHAR(100) NOT NULL,
    exam_type VARCHAR(50) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    marks VARCHAR(50) NOT NULL,
    total_marks VARCHAR(50) NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL,
    status VARCHAR(20) NOT NULL, -- e.g., Passed or Failed
    report_date DATE DEFAULT CURRENT_DATE -- The date of report generation
);

CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    teacher VARCHAR(255) NOT NULL,
    day VARCHAR(50) NOT NULL,
    time VARCHAR(50) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    class VARCHAR(50) NOT NULL,
    section VARCHAR(10) NOT NULL,
    date DATE NOT NULL
);
-- Table: teacher_register
CREATE TABLE teacher_register (
    teacher_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    date_of_birth DATE,
    role VARCHAR(50),
    phone_no VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    password VARCHAR(100) NOT NULL,
    experience INT,
    photo TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'teacher'
);

-- Table: parent_register
CREATE TABLE parent_register (
    parent_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone_no VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    relationship VARCHAR(50),
    password VARCHAR(100) NOT NULL,
    child_name VARCHAR(100),
    child_class VARCHAR(50),
    child_section VARCHAR(10),
    address TEXT,
    role VARCHAR(50),
    student_id INT,
    role VARCHAR(50) NOT NULL DEFAULT 'parent',
    FOREIGN KEY (student_id) REFERENCES student_register(student_id) ON DELETE CASCADE
);

-- Create the marks table
CREATE TABLE marks (
    id SERIAL PRIMARY KEY, -- Adding PRIMARY KEY to the id column
    student_id INTEGER NOT NULL REFERENCES student_register(student_id), -- Ensure student_id is NOT NULL for referential integrity
    student_name VARCHAR(100) NOT NULL, -- Ensure student_name is NOT NULL
    teacher_id INTEGER NOT NULL REFERENCES teacher_register(teacher_id), -- Ensure teacher_id is NOT NULL for referential integrity
    teacher_name VARCHAR(100) NOT NULL, -- Ensure teacher_name is NOT NULL
    subject VARCHAR(100) NOT NULL, -- Ensure subject is NOT NULL
    class VARCHAR(10) NOT NULL, -- Ensure class is NOT NULL
    section VARCHAR(5) NOT NULL, -- Ensure section is NOT NULL
    exam_type VARCHAR(50) NOT NULL, -- Ensure exam_type is NOT NULL
    exam_date DATE DEFAULT CURRENT_DATE, -- Defaults to the current date if no date is provided
    marks VARCHAR(50) NOT NULL -- Ensure marks is NOT NULL
);

CREATE TABLE marks (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES student_register(student_id),
    student_name VARCHAR(100) NOT NULL,
    teacher_id INTEGER REFERENCES teacher_register(teacher_id),
    teacher_name VARCHAR(100) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    class VARCHAR(10) NOT NULL,
    section VARCHAR(5) NOT NULL,
    exam_type VARCHAR(50) NOT NULL,
    exam_date DATE DEFAULT CURRENT_DATE,
    marks VARCHAR(50) NOT NULL
);

-- Table: exam_timetable
 
    CREATE TABLE exam_timetable (
    day VARCHAR(15),
    class VARCHAR(50),
    section VARCHAR(10),  -- Added section column
    subject VARCHAR(100),
    date DATE,
    time TIME,
    exam_type VARCHAR(50),
    PRIMARY KEY (class, section, subject, date)  -- Updated primary key to include section
);


-- Table: login
CREATE TABLE login (
    role VARCHAR(50),
    email VARCHAR(100) UNIQUE,
    phone_no VARCHAR(15) UNIQUE,
    password VARCHAR(100) NOT NULL
);
--class timetable
 CREATE TABLE classtimetable (
    class_name VARCHAR(50),
    section VARCHAR(10),
    subject VARCHAR(100),
    teacher_name VARCHAR(100),
    teacher_id INT REFERENCES teacher_register(teacher_id),
    day VARCHAR(15),
    time TIME,
    PRIMARY KEY (class_name, section, day, time)
);

-- Table: teacher_attendance
CREATE TABLE teacher_attendance (
    attendance_id SERIAL PRIMARY KEY,
    teacher_id INT NOT NULL REFERENCES teacher_register(teacher_id),
    teacher_name VARCHAR(100),
    day DATE DEFAULT CURRENT_DATE,
    status VARCHAR(10),
    time TIME DEFAULT CURRENT_TIME
);

-- Table: student_attendance
 CREATE TABLE student_attendance (
    id SERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    teacher_id INT NOT NULL REFERENCES teacher_register(teacher_id),
    teacher_name VARCHAR(100),
    student_id int not null,
    student_name varchar(100),
    status VARCHAR(10),
    time TIME DEFAULT CURRENT_TIME,
    class varchar(100),
    section varchar(100)
);

-- Table: add_assignment
CREATE TABLE add_assignment_std (
    assignment_id SERIAL PRIMARY KEY,
    teacher_id INT NOT NULL,
    teacher_name VARCHAR(100),
    class VARCHAR(50),
    section VARCHAR(10),
    title VARCHAR(100),
    date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    subject VARCHAR(100),
    source_file TEXT,
    FOREIGN KEY (teacher_id) REFERENCES teacher_register(teacher_id)
);

-- Table: submitted_assignment
CREATE TABLE submitted_assignment_std (
    submission_id SERIAL PRIMARY KEY,
    assignment_id INT,
    student_id INT,
    student_name VARCHAR(100),
    class varchar(50),
    section varchar(50),
    submitted_status VARCHAR(50),
    
    FOREIGN KEY (student_id) REFERENCES student_register(student_id)
);

-- Table: syllabus
CREATE TABLE syllabus (
    syllabus_id SERIAL PRIMARY KEY,
    subject VARCHAR(100),
    sub_topic VARCHAR(100),
    date DATE DEFAULT CURRENT_DATE,
    file TEXT,
    class VARCHAR(50),
    teacher_id INT NOT NULL,
    teacher_name VARCHAR(100),
    FOREIGN KEY (teacher_id) REFERENCES teacher_register(teacher_id)
);

-- -- Teacher Leave
-- CREATE TABLE teacher_leave (
--     teacher_id INTEGER REFERENCES teacher_register(teacher_id),
--     name VARCHAR(100),
--     leave_from DATE,
--     leave_to DATE,
--     reason TEXT,
--     status VARCHAR(20)
-- );

-- CREATE TABLE leave (
--     teacher_id INTEGER ,
--     teacher_name VARCHAR(100),
--     leave_from DATE,
--     leave_to DATE,
--     reason TEXT,
--     status VARCHAR(20)
-- );
-- -- Parent Leave
-- CREATE TABLE teacherleave (
--     parent_id INTEGER,
--     parent_name VARCHAR(100),
--     student_id varchar(100),
--     student_name varchar(100),
--     leave_from DATE,
--     leave_to DATE,
--     reason TEXT,
--     status VARCHAR(20)
-- );



-- Notification
CREATE TABLE notification (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50),
    title VARCHAR(100),
    description TEXT,
    time TIME,
    date DATE,
    read BOOLEAN
);

-- -- Reply Notification
-- CREATE TABLE reply_notification (
--     id SERIAL PRIMARY KEY,
--     role VARCHAR(50),
--     title VARCHAR(100),
--     description TEXT,
--     date DATE,
--     time TIME
-- );


CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES student_register(student_id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    leave_from DATE NOT NULL,
    leave_to DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' NOT NULL,
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    teacher_name VARCHAR(255) NOT NULL
);