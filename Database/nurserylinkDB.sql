-- ======================================================
-- NURSERYLINK DATABASE - IMPROVED WITH NAMES, GENDERS & FAMILIES
-- ======================================================

-- Drop tables if they exist (in correct order to avoid foreign key conflicts)
DROP TABLE IF EXISTS admin_previlledge CASCADE;
DROP TABLE IF EXISTS supplyrequest_to_parent CASCADE;
DROP TABLE IF EXISTS incident_to_parent CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS supply_request CASCADE;
DROP TABLE IF EXISTS incidient_report CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS child_parent CASCADE;
DROP TABLE IF EXISTS parent CASCADE;
DROP TABLE IF EXISTS teacher_class CASCADE; -- NEW Many-to-Many Join Table
DROP TABLE IF EXISTS teacher CASCADE;
DROP TABLE IF EXISTS child CASCADE;
DROP TABLE IF EXISTS class CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS priviliedge CASCADE;

-- ======================================================
-- 1. CREATE TABLES (ALL with TIMESTAMPS + NEW COLUMNS)
-- ======================================================

-- Account table (users)
CREATE TABLE account (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('parent', 'teacher', 'admin')) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Privilege table
CREATE TABLE priviliedge (
    id BIGSERIAL PRIMARY KEY,
    description VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin privileges junction
CREATE TABLE admin_previlledge (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL,
    privilege_id BIGINT NOT NULL, -- Changed from VARCHAR(50)
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES account(id),
    FOREIGN KEY (privilege_id) REFERENCES priviliedge(id) -- New Foreign Key
);
-- Class table
CREATE TABLE class (
    id BIGSERIAL PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    subjects VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teacher table (UPDATED: removed class_id for many-to-many relationship)
CREATE TABLE teacher (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES account(id)
);

-- Teacher-Class join table (NEW: Many-to-Many relationship)
CREATE TABLE teacher_class (
    teacher_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (teacher_id, class_id),
    FOREIGN KEY (teacher_id) REFERENCES teacher(id),
    FOREIGN KEY (class_id) REFERENCES class(id)
);

-- Parent table 
CREATE TABLE parent (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL,
    child_count BIGINT DEFAULT 0,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES account(id)
);

-- Child table 
CREATE TABLE child (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT NOT NULL,
    account_id BIGINT,
    class_id BIGINT,
    name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    summary_log VARCHAR(255),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parent(id),
    FOREIGN KEY (account_id) REFERENCES account(id),
    FOREIGN KEY (class_id) REFERENCES class(id)
);

-- Child-Parent join table 
CREATE TABLE child_parent (
    child_id BIGINT NOT NULL,
    parent_id BIGINT NOT NULL,
    PRIMARY KEY (child_id, parent_id),
    FOREIGN KEY (child_id) REFERENCES child(id),
    FOREIGN KEY (parent_id) REFERENCES parent(id)
);

-- Attendance records
CREATE TABLE attendance_records (
    id BIGSERIAL PRIMARY KEY,
    child_id BIGINT NOT NULL,
    check_in_time TIMESTAMP NOT NULL,
    check_out_time TIMESTAMP,
    status BOOLEAN DEFAULT TRUE,
    reason VARCHAR(255),
    admin_id BIGINT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES child(id),
    FOREIGN KEY (admin_id) REFERENCES account(id)
);

-- Activity Logs (UPDATED: Replaced specific activity details with a JSONB column)
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL,
    log_type VARCHAR(50) CHECK (log_type IN ('meal', 'toilet', 'temperature', 'note', 'sleep', 'medication')),
    activity_timestamp TIMESTAMP NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comments VARCHAR(255),
    log_details JSONB, -- <--- Replaces all the individual property columns
    FOREIGN KEY (account_id) REFERENCES account(id)
);

-- Incident Report
CREATE TABLE incidient_report (
    id BIGSERIAL PRIMARY KEY,
    child_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    description VARCHAR(255),
    severity_level VARCHAR(50) CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    incident_timestamp TIMESTAMP NOT NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES child(id),
    FOREIGN KEY (teacher_id) REFERENCES teacher(id)
);

-- Incident to Parent junction
CREATE TABLE incident_to_parent (
    id BIGSERIAL PRIMARY KEY,
    incidient_id BIGINT NOT NULL,
    parent_id BIGINT NOT NULL,
    notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    FOREIGN KEY (incidient_id) REFERENCES incidient_report(id),
    FOREIGN KEY (parent_id) REFERENCES parent(id)
);

-- Supply Request
CREATE TABLE supply_request (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL,
    item VARCHAR(100) NOT NULL,
    quantity BIGINT NOT NULL,
    note VARCHAR(255),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'cancelled')),
    FOREIGN KEY (teacher_id) REFERENCES teacher(id)
);

-- Supply Request to Parent
CREATE TABLE supplyrequest_to_parent (
    id BIGSERIAL PRIMARY KEY,
    supply_id BIGINT NOT NULL,
    parent_id BIGINT NOT NULL,
    notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    response VARCHAR(255),
    FOREIGN KEY (supply_id) REFERENCES supply_request(id),
    FOREIGN KEY (parent_id) REFERENCES parent(id)
);

-- Announcements
CREATE TABLE announcements (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    text VARCHAR(500),
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (teacher_id) REFERENCES teacher(id),
    FOREIGN KEY (class_id) REFERENCES class(id)
);

-- Notifications
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL,
    notification_type VARCHAR(50) CHECK (notification_type IN ('incident', 'supply', 'announcement', 'attendance', 'activity', 'temperature_alert')),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    seen_at TIMESTAMP,
    handled_at TIMESTAMP,
    seen BOOLEAN DEFAULT FALSE,
    handled BOOLEAN DEFAULT FALSE,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    FOREIGN KEY (account_id) REFERENCES account(id)
);


-- ======================================================
-- 2. INSERT DUMMY DATA WITH REALISTIC TIMESTAMPS
-- ======================================================

-- ... [Account, Parent, Child insert statements remain unchanged] ...

-- Insert Parents 
INSERT INTO account (username, full_name, email, password, role, is_active, created_at) VALUES
('john.smith', 'John Smith', 'john.smith@email.com', 'hashed_pw_1', 'parent', true, '2024-01-15 08:30:00'),
('sarah.smith', 'Sarah Smith', 'sarah.smith@email.com', 'hashed_pw_2', 'parent', true, '2024-01-15 09:15:00'),
('michael.johnson', 'Michael Johnson', 'michael.johnson@email.com', 'hashed_pw_3', 'parent', true, '2024-02-20 10:00:00'),
('emily.johnson', 'Emily Johnson', 'emily.johnson@email.com', 'hashed_pw_4', 'parent', true, '2024-02-20 10:30:00'),
('david.williams', 'David Williams', 'david.williams@email.com', 'hashed_pw_5', 'parent', true, '2024-03-10 11:00:00'),
('jessica.williams', 'Jessica Williams', 'jessica.williams@email.com', 'hashed_pw_6', 'parent', true, '2024-03-10 11:30:00'),
('james.brown', 'James Brown', 'james.brown@email.com', 'hashed_pw_7', 'parent', true, '2024-04-05 09:00:00'),
('lisa.brown', 'Lisa Brown', 'lisa.brown@email.com', 'hashed_pw_8', 'parent', true, '2024-04-05 09:45:00'),
('robert.jones', 'Robert Jones', 'robert.jones@email.com', 'hashed_pw_9', 'parent', true, '2024-05-12 14:00:00'),
('patricia.jones', 'Patricia Jones', 'patricia.jones@email.com', 'hashed_pw_10', 'parent', true, '2024-05-12 14:30:00'),
('carlos.garcia', 'Carlos Garcia', 'carlos.garcia@email.com', 'hashed_pw_11', 'parent', true, '2024-06-18 08:00:00'),
('maria.garcia', 'Maria Garcia', 'maria.garcia@email.com', 'hashed_pw_12', 'parent', true, '2024-06-18 08:45:00'),
('thomas.miller', 'Thomas Miller', 'thomas.miller@email.com', 'hashed_pw_13', 'parent', true, '2024-07-22 10:00:00'),
('jennifer.miller', 'Jennifer Miller', 'jennifer.miller@email.com', 'hashed_pw_14', 'parent', true, '2024-07-22 10:30:00'),
('charles.davis', 'Charles Davis', 'charles.davis@email.com', 'hashed_pw_15', 'parent', true, '2024-08-30 11:00:00'),
('linda.davis', 'Linda Davis', 'linda.davis@email.com', 'hashed_pw_16', 'parent', true, '2024-08-30 11:30:00'),
('jose.rodriguez', 'Jose Rodriguez', 'jose.rodriguez@email.com', 'hashed_pw_17', 'parent', true, '2024-09-14 09:00:00'),
('diana.rodriguez', 'Diana Rodriguez', 'diana.rodriguez@email.com', 'hashed_pw_18', 'parent', true, '2024-09-14 09:30:00'),
('juan.martinez', 'Juan Martinez', 'juan.martinez@email.com', 'hashed_pw_19', 'parent', true, '2024-10-01 08:00:00'),
('elena.martinez', 'Elena Martinez', 'elena.martinez@email.com', 'hashed_pw_20', 'parent', true, '2024-10-01 08:30:00'),
('miguel.hernandez', 'Miguel Hernandez', 'miguel.hernandez@email.com', 'hashed_pw_21', 'parent', true, '2024-11-11 10:00:00'),
('ana.hernandez', 'Ana Hernandez', 'ana.hernandez@email.com', 'hashed_pw_22', 'parent', true, '2024-11-11 10:30:00'),
('tony.lopez', 'Tony Lopez', 'tony.lopez@email.com', 'hashed_pw_23', 'parent', true, '2024-12-05 09:00:00'),
('gloria.lopez', 'Gloria Lopez', 'gloria.lopez@email.com', 'hashed_pw_24', 'parent', true, '2024-12-05 09:30:00'),
('ben.wilson', 'Ben Wilson', 'ben.wilson@email.com', 'hashed_pw_25', 'parent', true, '2025-01-20 08:00:00'),
('amy.wilson', 'Amy Wilson', 'amy.wilson@email.com', 'hashed_pw_26', 'parent', true, '2025-01-20 08:30:00'),
('paul.anderson', 'Paul Anderson', 'paul.anderson@email.com', 'hashed_pw_27', 'parent', true, '2025-02-14 10:00:00'),
('laura.anderson', 'Laura Anderson', 'laura.anderson@email.com', 'hashed_pw_28', 'parent', true, '2025-02-14 10:30:00'),
('kevin.thomas', 'Kevin Thomas', 'kevin.thomas@email.com', 'hashed_pw_29', 'parent', true, '2025-03-01 09:00:00'),
('kimberly.thomas', 'Kimberly Thomas', 'kimberly.thomas@email.com', 'hashed_pw_30', 'parent', true, '2025-03-01 09:30:00');

INSERT INTO parent (account_id, child_count, gender, registered_at) VALUES
(1, 1, 'male', '2024-01-15 08:30:00'),
(2, 1, 'female', '2024-01-15 09:15:00'),
(3, 1, 'male', '2024-02-20 10:00:00'),
(4, 1, 'female', '2024-02-20 10:30:00'),
(5, 1, 'male', '2024-03-10 11:00:00'),
(6, 1, 'female', '2024-03-10 11:30:00'),
(7, 1, 'male', '2024-04-05 09:00:00'),
(8, 1, 'female', '2024-04-05 09:45:00'),
(9, 1, 'male', '2024-05-12 14:00:00'),
(10, 1, 'female', '2024-05-12 14:30:00'),
(11, 1, 'male', '2024-06-18 08:00:00'),
(12, 1, 'female', '2024-06-18 08:45:00'),
(13, 1, 'male', '2024-07-22 10:00:00'),
(14, 1, 'female', '2024-07-22 10:30:00'),
(15, 1, 'male', '2024-08-30 11:00:00'),
(16, 1, 'female', '2024-08-30 11:30:00'),
(17, 1, 'male', '2024-09-14 09:00:00'),
(18, 1, 'female', '2024-09-14 09:30:00'),
(19, 1, 'male', '2024-10-01 08:00:00'),
(20, 1, 'female', '2024-10-01 08:30:00'),
(21, 1, 'male', '2024-11-11 10:00:00'),
(22, 1, 'female', '2024-11-11 10:30:00'),
(23, 1, 'male', '2024-12-05 09:00:00'),
(24, 1, 'female', '2024-12-05 09:30:00'),
(25, 1, 'male', '2025-01-20 08:00:00'),
(26, 1, 'female', '2025-01-20 08:30:00'),
(27, 1, 'male', '2025-02-14 10:00:00'),
(28, 1, 'female', '2025-02-14 10:30:00'),
(29, 1, 'male', '2025-03-01 09:00:00'),
(30, 1, 'female', '2025-03-01 09:30:00');

INSERT INTO class (class_name, subjects, created_at, updated_at) VALUES
('Tiny Tots (0-1 years)', 'Sensory Play, Music, Baby Sign Language', '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('Little Explorers (1-2 years)', 'Art, Music, Movement, Story Time', '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('Busy Bees (2-3 years)', 'Numbers, Letters, Arts, Science, Music', '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
('Pre-K Prep (3-4 years)', 'Literacy, Math, Science, Art, Social Skills', '2024-01-01 08:00:00', '2024-01-01 08:00:00');

-- Insert Teachers 
INSERT INTO account (username, full_name, email, password, role, is_active, created_at) VALUES
('sarah.teacher1', 'Sarah Johnson', 'sarah.j@nurserylink.com', 'hashed_teacher_1', 'teacher', true, '2024-01-01 08:00:00'),
('mike.teacher2', 'Mike Thompson', 'mike.t@nurserylink.com', 'hashed_teacher_2', 'teacher', true, '2024-01-01 08:30:00'),
('lisa.teacher3', 'Lisa Rodriguez', 'lisa.r@nurserylink.com', 'hashed_teacher_3', 'teacher', true, '2024-01-01 09:00:00'),
('david.teacher4', 'David Kim', 'david.k@nurserylink.com', 'hashed_teacher_4', 'teacher', true, '2024-01-01 09:30:00'),
('emma.teacher5', 'Emma Wilson', 'emma.w@nurserylink.com', 'hashed_teacher_5', 'teacher', true, '2024-01-15 10:00:00'),
('chris.teacher6', 'Chris Brown', 'chris.b@nurserylink.com', 'hashed_teacher_6', 'teacher', true, '2024-01-15 10:30:00');

-- Insert teacher base records
INSERT INTO teacher (account_id, gender, assigned_at) VALUES
(31, 'female', '2024-01-01 09:00:00'),
(32, 'male', '2024-01-01 09:00:00'),
(33, 'female', '2024-01-01 09:00:00'),
(34, 'male', '2024-01-01 09:00:00'),
(35, 'female', '2024-01-15 10:00:00'),
(36, 'male', '2024-01-15 10:30:00');

-- Insert Teacher-Class assignments (Many-to-Many Mappings)
INSERT INTO teacher_class (teacher_id, class_id, assigned_at) VALUES
(1, 1, '2024-01-01 09:00:00'),
(2, 2, '2024-01-01 09:00:00'),
(3, 3, '2024-01-01 09:00:00'),
(4, 4, '2024-01-01 09:00:00'),
(5, 1, '2024-01-15 10:00:00'),
(6, 2, '2024-01-15 10:30:00');

-- Insert Children
INSERT INTO child (parent_id, account_id, class_id, name, date_of_birth, summary_log, enrolled_at) VALUES
(1, NULL, 1, 'Emma Smith', '2025-08-15', 'Emma loves sensory play and music time. Very social baby.', '2025-09-01 08:30:00'),
(2, NULL, 2, 'Noah Smith', '2024-10-15', 'Noah loves building blocks and painting. Great imagination.', '2024-10-15 08:30:00'),
(3, NULL, 1, 'Liam Johnson', '2025-09-20', 'Liam enjoys tummy time and listening to stories.', '2025-09-20 09:00:00'),
(4, NULL, 3, 'Ava Johnson', '2023-08-10', 'Ava is energetic and loves running around the playground.', '2023-08-10 09:00:00'),
(5, NULL, 1, 'Olivia Williams', '2025-10-05', 'Olivia is curious about everything. Reaches for toys eagerly.', '2025-10-05 08:45:00'),
(6, NULL, 4, 'Mason Williams', '2022-08-15', 'Mason enjoys music and dancing. Always humming tunes.', '2022-08-15 08:30:00'),
(7, NULL, 2, 'Ava Brown', '2024-11-02', 'Ava loves painting and has a great imagination.', '2024-11-02 09:00:00'),
(9, NULL, 2, 'Mason Jones', '2024-09-28', 'Mason enjoys music and dancing. Always humming tunes.', '2024-09-28 08:30:00'),
(11, NULL, 2, 'Isabella Garcia', '2024-12-10', 'Isabella is gentle and loves reading books. Very articulate.', '2024-12-10 09:15:00'),
(13, NULL, 3, 'James Miller', '2023-10-20', 'James loves puzzles and math activities. Quick learner.', '2023-10-20 08:30:00'),
(15, NULL, 3, 'Charlotte Davis', '2023-11-15', 'Charlotte is creative and loves arts and crafts.', '2023-11-15 09:00:00'),
(17, NULL, 3, 'Benjamin Rodriguez', '2023-09-05', 'Benjamin is curious about science experiments.', '2023-09-05 08:30:00'),
(19, NULL, 3, 'Mia Martinez', '2023-12-25', 'Mia has great communication skills. Loves group activities.', '2023-12-25 09:00:00'),
(21, NULL, 4, 'Lucas Hernandez', '2022-11-10', 'Lucas is excellent at reading and writing. Very focused.', '2022-11-10 08:30:00'),
(23, NULL, 4, 'Evelyn Lopez', '2022-10-30', 'Evelyn is social and helps other children. Natural leader.', '2022-10-30 09:00:00'),
(25, NULL, 4, 'Logan Wilson', '2022-09-18', 'Logan loves math and science experiments.', '2022-09-18 08:30:00'),
(27, NULL, 4, 'Sophia Anderson', '2022-12-01', 'Sophia is artistic and loves painting and crafts.', '2022-12-01 09:00:00'),
(29, NULL, 4, 'Ethan Thomas', '2022-11-20', 'Ethan enjoys building with blocks and outdoor play.', '2022-11-20 09:00:00');

INSERT INTO child_parent (child_id, parent_id)
SELECT c.id, c.parent_id FROM child c
UNION
SELECT c.id, CASE WHEN c.parent_id % 2 = 1 THEN c.parent_id + 1 ELSE c.parent_id - 1 END
FROM child c;

INSERT INTO account (username, full_name, email, password, role, is_active, created_at) VALUES
('admin.mary', 'Mary Thompson', 'mary@nurserylink.com', 'hashed_admin_1', 'admin', true, '2024-01-01 08:00:00'),
('admin.johnny', 'Johnny Davis', 'johnny@nurserylink.com', 'hashed_admin_2', 'admin', true, '2024-01-01 08:15:00');


-- ======================================================
-- 3. GENERATE EXTENSIVE HISTORY WITH TIMESTAMPS
-- ======================================================

-- 3.1 ATTENDANCE RECORDS (Unchanged)
INSERT INTO attendance_records (child_id, check_in_time, check_out_time, status, reason, admin_id)
SELECT 
    c.id,
    (d::date + time '08:00' + (RANDOM() * INTERVAL '30 minutes'))::timestamp AS check_in,
    (d::date + time '15:00' + (RANDOM() * INTERVAL '1 hour'))::timestamp AS check_out,
    CASE WHEN RANDOM() < 0.85 THEN TRUE ELSE FALSE END,
    CASE WHEN RANDOM() > 0.85 THEN 
        CASE (FLOOR(RANDOM() * 4)::INT)
            WHEN 0 THEN 'Sick - high fever'
            WHEN 1 THEN 'Family vacation'
            WHEN 2 THEN 'Doctor appointment at 10:00'
            ELSE 'Personal day'
        END
    ELSE NULL
    END,
    CASE WHEN RANDOM() < 0.3 THEN 37 ELSE 38 END
FROM child c
CROSS JOIN generate_series('2025-09-01'::date, '2026-03-15'::date, '1 day'::interval) d
WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
    AND RANDOM() < 0.3
LIMIT 2000;

-- 3.2 ACTIVITY LOGS WITH PRECISE TIMESTAMPS (UPDATED: JSONB Formatting)
-- Meal logs
INSERT INTO activity_logs (account_id, log_type, activity_timestamp, comments, log_details)
SELECT 
    t.account_id,
    'meal',
    (date_trunc('day', d) + 
        CASE (FLOOR(RANDOM() * 3)::INT)
            WHEN 0 THEN time '08:30' + (RANDOM() * INTERVAL '30 minutes')
            WHEN 1 THEN time '12:00' + (RANDOM() * INTERVAL '45 minutes')
            ELSE time '15:30' + (RANDOM() * INTERVAL '30 minutes')
        END
    )::timestamp,
    CASE (FLOOR(RANDOM() * 5)::INT)
        WHEN 0 THEN 'Ate all of breakfast - 25 minutes'
        WHEN 1 THEN 'Ate half of lunch - 15 minutes'
        WHEN 2 THEN 'Ate most of dinner - 20 minutes'
        WHEN 3 THEN 'Had second helping - 30 minutes'
        ELSE 'Did not eat much - 10 minutes'
    END,
    jsonb_build_object(
        'food_portion', CASE (FLOOR(RANDOM() * 3)::INT) WHEN 0 THEN 'Full' WHEN 1 THEN 'Half' ELSE 'Small' END,
        'meal_type', CASE (FLOOR(RANDOM() * 3)::INT) WHEN 0 THEN 'Breakfast' WHEN 1 THEN 'Lunch' ELSE 'Snack' END
    )
FROM teacher t
CROSS JOIN generate_series('2025-09-01'::date, '2026-03-15'::date, '1 day'::interval) d
WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5 AND RANDOM() < 0.25
LIMIT 3000;

-- Toilet logs
INSERT INTO activity_logs (account_id, log_type, activity_timestamp, comments, log_details)
SELECT 
    t.account_id,
    'toilet',
    (date_trunc('day', d) + time '09:00' + (RANDOM() * INTERVAL '6 hours'))::timestamp,
    CASE (FLOOR(RANDOM() * 4)::INT)
        WHEN 0 THEN 'Successful toilet visit - 5 minutes'
        WHEN 1 THEN 'Accident at 10:15 - changed clothes'
        WHEN 2 THEN 'Dry diaper - checked at 11:30'
        ELSE 'Wet diaper - changed at 14:00'
    END,
    jsonb_build_object(
        'toilet_type', CASE (FLOOR(RANDOM() * 3)::INT) WHEN 0 THEN 'Potty' WHEN 1 THEN 'Diaper' ELSE 'Training pants' END
    )
FROM teacher t
CROSS JOIN generate_series('2025-09-01'::date, '2026-03-15'::date, '1 day'::interval) d
WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5 AND RANDOM() < 0.2
LIMIT 2000;

-- Temperature logs
INSERT INTO activity_logs (account_id, log_type, activity_timestamp, comments, log_details)
SELECT 
    t.account_id,
    'temperature',
    (date_trunc('day', d) + 
        CASE (FLOOR(RANDOM() * 3)::INT)
            WHEN 0 THEN time '09:30' + (RANDOM() * INTERVAL '15 minutes')
            WHEN 1 THEN time '13:00' + (RANDOM() * INTERVAL '15 minutes')
            ELSE time '16:00' + (RANDOM() * INTERVAL '15 minutes')
        END
    )::timestamp,
    CASE 
        WHEN temp > 38.5 THEN 'HIGH FEVER - ' || temp || 'C - URGENT: Notified parents'
        WHEN temp > 38.0 THEN 'Fever - ' || temp || 'C - Parents notified, monitoring'
        WHEN temp > 37.5 THEN 'Elevated temperature - ' || temp || 'C - monitoring'
        ELSE 'Normal temperature - ' || temp || 'C'
    END,
    jsonb_build_object('degree_celsius', temp)
FROM teacher t
CROSS JOIN generate_series('2025-09-01'::date, '2026-03-15'::date, '1 day'::interval) d
CROSS JOIN LATERAL (SELECT ROUND(36.5 + RANDOM() * 2.5, 1) AS temp) t2
WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5 AND RANDOM() < 0.15
LIMIT 1500;

-- Sleep logs
INSERT INTO activity_logs (account_id, log_type, activity_timestamp, comments, log_details)
SELECT 
    t.account_id,
    'sleep',
    (date_trunc('day', d) + time '12:30' + (RANDOM() * INTERVAL '45 minutes'))::timestamp,
    CASE (FLOOR(RANDOM() * 3)::INT)
        WHEN 0 THEN 'Slept peacefully for 90 minutes'
        WHEN 1 THEN 'Woke up after 45 minutes'
        ELSE 'Deep sleep - 120 minutes'
    END,
    jsonb_build_object('sleep_duration_minutes', (FLOOR(RANDOM() * 90) + 30)::INT)
FROM teacher t
CROSS JOIN generate_series('2025-09-01'::date, '2026-03-15'::date, '1 day'::interval) d
WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5 AND RANDOM() < 0.15
LIMIT 500;

-- 3.3 INCIDENT REPORTS (UPDATED: Queries through Teacher_Class)
INSERT INTO incidient_report (child_id, teacher_id, description, severity_level, incident_timestamp, reported_at, resolved_at)
SELECT 
    c.id,
    tc.teacher_id,
    CASE (FLOOR(RANDOM() * 6)::INT)
        WHEN 0 THEN 'Minor scrape on knee during outdoor play at 10:30'
        WHEN 1 THEN 'Fell off slide at 11:15 - no serious injury, crying for 5 minutes'
        WHEN 2 THEN 'Bumped head on table at 09:45 - ice applied for 10 minutes'
        WHEN 3 THEN 'Pushed by another child at 14:20 - minor bruise on arm'
        WHEN 4 THEN 'Mild allergic reaction to snack at 10:00 - antihistamine administered'
        ELSE 'Tripped while running at 15:00 - scraped elbow, bandaged'
    END,
    CASE (FLOOR(RANDOM() * 4)::INT) WHEN 0 THEN 'low' WHEN 1 THEN 'medium' WHEN 2 THEN 'high' ELSE 'critical' END,
    (d::date + time '09:00' + (RANDOM() * INTERVAL '6 hours'))::timestamp,
    (d::date + time '09:05' + (RANDOM() * INTERVAL '10 minutes'))::timestamp,
    (d::date + time '09:20' + (RANDOM() * INTERVAL '30 minutes'))::timestamp
FROM child c
JOIN teacher_class tc ON c.class_id = tc.class_id
CROSS JOIN generate_series('2025-09-01'::date, '2026-03-10'::date, '1 day'::interval) d
WHERE RANDOM() < 0.02
    AND EXTRACT(DOW FROM d) BETWEEN 1 AND 5
LIMIT 50;

INSERT INTO incident_to_parent (incidient_id, parent_id, notified_at, acknowledged_at)
SELECT 
    ir.id,
    c.parent_id,
    ir.reported_at + INTERVAL '5 minutes' + (RANDOM() * INTERVAL '10 minutes'),
    CASE WHEN RANDOM() > 0.3 THEN 
        ir.reported_at + INTERVAL '30 minutes' + (RANDOM() * INTERVAL '2 hours')
    ELSE NULL END
FROM incidient_report ir
JOIN child c ON ir.child_id = c.id
WHERE RANDOM() < 0.7;

-- 3.4 SUPPLY REQUESTS
INSERT INTO supply_request (teacher_id, item, quantity, note, requested_at, fulfilled_at, status)
SELECT 
    t.id,
    CASE (FLOOR(RANDOM() * 8)::INT)
        WHEN 0 THEN 'Art paper - A4 white'
        WHEN 1 THEN 'Crayons - 16 pack'
        WHEN 2 THEN 'Play-doh - 5 colors'
        WHEN 3 THEN 'Glue sticks - 20g'
        WHEN 4 THEN 'Safety scissors'
        WHEN 5 THEN 'Tempera paint - 6 colors'
        WHEN 6 THEN 'Construction paper'
        ELSE 'Watercolor paints'
    END,
    (FLOOR(RANDOM() * 15) + 5)::BIGINT,
    CASE 
        WHEN RANDOM() > 0.7 THEN 'URGENT: Running low, need by tomorrow morning'
        WHEN RANDOM() > 0.4 THEN 'Regular restock for next month'
        ELSE 'For upcoming art project next week'
    END,
    (d::date + time '09:00' + (RANDOM() * INTERVAL '3 hours'))::timestamp,
    CASE WHEN RANDOM() > 0.3 THEN (d::date + time '14:00' + (RANDOM() * INTERVAL '2 days'))::timestamp ELSE NULL END,
    CASE (FLOOR(RANDOM() * 3)::INT) WHEN 0 THEN 'pending' WHEN 1 THEN 'approved' ELSE 'fulfilled' END
FROM teacher t
CROSS JOIN generate_series('2025-09-01'::date, '2026-03-10'::date, '1 day'::interval) d
WHERE RANDOM() < 0.03 AND EXTRACT(DOW FROM d) BETWEEN 1 AND 5
LIMIT 35;

-- 3.5 ANNOUNCEMENTS (UPDATED: Queries through Teacher_Class)
INSERT INTO announcements (teacher_id, class_id, title, text, published_at, expires_at, is_active)
SELECT 
    tc.teacher_id,
    tc.class_id,
    CASE (FLOOR(RANDOM() * 5)::INT)
        WHEN 0 THEN 'Field Trip to Zoo - March 20, 2026'
        WHEN 1 THEN 'Parent-Teacher Conference Schedule'
        WHEN 2 THEN 'End of Year Celebration - June 15'
        WHEN 3 THEN 'New Sensory Play Equipment Arriving'
        ELSE 'Important: Class Photo Day'
    END,
    CASE (FLOOR(RANDOM() * 5)::INT)
        WHEN 0 THEN 'We will be visiting the zoo on March 20. Permission slips due by March 15. Departure at 9:00 AM sharp.'
        WHEN 1 THEN 'Parent-teacher conferences will be held on April 5-6. 15-minute slots available from 8:00 AM to 6:00 PM.'
        WHEN 2 THEN 'Join us for our End of Year Celebration on June 15 at 10:00 AM. Family members welcome!'
        WHEN 3 THEN 'New sensory play equipment arrives next Monday. Children will have new activities available starting Wednesday.'
        ELSE 'Class photo day is scheduled for Friday, April 10 at 9:30 AM. Please dress children in bright colors.'
    END,
    (d::date + time '08:00' + (RANDOM() * INTERVAL '3 hours'))::timestamp,
    (d::date + INTERVAL '14 days' + time '17:00')::timestamp,
    RANDOM() > 0.2
FROM teacher_class tc
CROSS JOIN generate_series('2025-09-01'::date, '2026-03-01'::date, '1 week'::interval) d
WHERE RANDOM() < 0.15 AND EXTRACT(DOW FROM d) BETWEEN 1 AND 5
LIMIT 30;

-- 3.6 NOTIFICATIONS
INSERT INTO notifications (account_id, notification_type, sent_at, seen_at, handled_at, seen, handled, description, priority)
SELECT 
    p.account_id,
    CASE (FLOOR(RANDOM() * 5)::INT)
        WHEN 0 THEN 'incident'
        WHEN 1 THEN 'activity'
        WHEN 2 THEN 'attendance'
        WHEN 3 THEN 'announcement'
        ELSE 'temperature_alert'
    END,
    (d::date + time '08:00' + (RANDOM() * INTERVAL '8 hours'))::timestamp,
    CASE WHEN RANDOM() > 0.3 THEN (d::date + time '08:05' + (RANDOM() * INTERVAL '4 hours'))::timestamp ELSE NULL END,
    CASE WHEN RANDOM() > 0.5 THEN (d::date + time '08:10' + (RANDOM() * INTERVAL '6 hours'))::timestamp ELSE NULL END,
    RANDOM() > 0.3,
    RANDOM() > 0.5,
    CASE (FLOOR(RANDOM() * 5)::INT)
        WHEN 0 THEN 'Your child had a minor incident at 10:30 AM. Details in the app.'
        WHEN 1 THEN 'New temperature reading recorded for your child at 2:15 PM - 37.2C'
        WHEN 2 THEN 'Your child was checked in at 8:45 AM today.'
        WHEN 3 THEN 'New announcement from your child''s class: Field Trip scheduled!'
        ELSE 'FEVER ALERT: Your child''s temperature is 38.5C. Action required.'
    END,
    CASE (FLOOR(RANDOM() * 4)::INT) WHEN 0 THEN 'low' WHEN 1 THEN 'normal' WHEN 2 THEN 'high' ELSE 'urgent' END
FROM parent p
CROSS JOIN generate_series('2025-09-01'::date, '2026-03-10'::date, '1 day'::interval) d
WHERE RANDOM() < 0.15 AND EXTRACT(DOW FROM d) BETWEEN 1 AND 5
LIMIT 200;

-- ======================================================
-- 4. FAMILY TREE VIEW
-- ======================================================
CREATE OR REPLACE VIEW family_tree_view AS
SELECT 
    c.id AS child_id,
    c.name AS child_name,
    c.date_of_birth AS child_dob,
    c.enrolled_at AS enrollment_date,
    father.full_name AS father_name,
    mother.full_name AS mother_name,
    father.email AS father_email,
    mother.email AS mother_email,
    cl.class_name,
    CONCAT(father.full_name, ' & ', mother.full_name) AS family_name,
    c.summary_log
FROM child c
JOIN parent pr_child ON c.parent_id = pr_child.id
JOIN parent pr_father ON pr_father.id = CASE WHEN pr_child.id % 2 = 1 THEN pr_child.id ELSE pr_child.id - 1 END
JOIN parent pr_mother ON pr_mother.id = pr_father.id + 1
JOIN account father ON pr_father.account_id = father.id
JOIN account mother ON pr_mother.account_id = mother.id
JOIN class cl ON c.class_id = cl.id
WHERE pr_father.gender = 'male' AND pr_mother.gender = 'female';

-- ======================================================
-- 5. USEFUL VIEWS FOR REPORTING
-- ======================================================

-- Daily Activity Summary
CREATE OR REPLACE VIEW daily_activity_summary AS
SELECT 
    DATE(activity_timestamp) AS day,
    log_type,
    COUNT(*) AS total_activities,
    MIN(activity_timestamp) AS first_activity,
    MAX(activity_timestamp) AS last_activity
FROM activity_logs
GROUP BY DATE(activity_timestamp), log_type
ORDER BY day DESC, log_type;

-- Recent Incidents 
CREATE OR REPLACE VIEW incident_report_view AS
SELECT 
    ir.id,
    c.id AS child_id,
    c.name AS child_name,
    ir.description,
    ir.severity_level,
    ir.incident_timestamp,
    ir.reported_at,
    ir.resolved_at,
    EXTRACT(EPOCH FROM (ir.resolved_at - ir.incident_timestamp))/60 AS resolution_minutes,
    ip.notified_at,
    ip.acknowledged_at,
    CASE WHEN ip.acknowledged_at IS NOT NULL THEN 'Acknowledged' ELSE 'Pending' END AS parent_status
FROM incidient_report ir
JOIN child c ON ir.child_id = c.id
LEFT JOIN incident_to_parent ip ON ir.id = ip.incidient_id
ORDER BY ir.incident_timestamp DESC;

-- Siblings view
CREATE OR REPLACE VIEW siblings_view AS
SELECT 
    c1.id AS child_id,
    c1.name AS child_name,
    c2.id AS sibling_id,
    c2.name AS sibling_name,
    father.full_name AS father_name,
    mother.full_name AS mother_name,
    cl.class_name
FROM child c1
JOIN parent pr1 ON c1.parent_id = pr1.id
JOIN parent pr_father ON pr_father.id = CASE WHEN pr1.id % 2 = 1 THEN pr1.id ELSE pr1.id - 1 END
JOIN parent pr_mother ON pr_mother.id = pr_father.id + 1
JOIN child c2 ON (c2.parent_id = pr_father.id OR c2.parent_id = pr_mother.id)
JOIN account father ON pr_father.account_id = father.id
JOIN account mother ON pr_mother.account_id = mother.id
JOIN class cl ON c1.class_id = cl.id
WHERE c1.id != c2.id
ORDER BY father.full_name, c1.name;

-- ======================================================
-- 6. VERIFICATION QUERIES
-- ======================================================

SELECT 'Accounts' AS table_name, COUNT(*) AS record_count FROM account
UNION ALL SELECT 'Parents', COUNT(*) FROM parent
UNION ALL SELECT 'Teachers', COUNT(*) FROM teacher
UNION ALL SELECT 'Teacher_Class Mappings', COUNT(*) FROM teacher_class
UNION ALL SELECT 'Children', COUNT(*) FROM child
UNION ALL SELECT 'Classes', COUNT(*) FROM class
UNION ALL SELECT 'Attendance', COUNT(*) FROM attendance_records
UNION ALL SELECT 'Activity Logs', COUNT(*) FROM activity_logs
UNION ALL SELECT 'Incidents', COUNT(*) FROM incidient_report
UNION ALL SELECT 'Notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'Supply Requests', COUNT(*) FROM supply_request
UNION ALL SELECT 'Announcements', COUNT(*) FROM announcements;

SELECT family_name, COUNT(*) AS children_count 
FROM family_tree_view 
GROUP BY family_name 
HAVING COUNT(*) > 1
ORDER BY children_count DESC;

(SELECT 'Attendance' AS event_type, check_in_time AS event_time, 
    'Child: ' || c.name AS details 
 FROM attendance_records ar JOIN child c ON ar.child_id = c.id LIMIT 5)
UNION ALL
(SELECT 'Activity', activity_timestamp, 
    log_type || ': ' || COALESCE(comments, '') 
 FROM activity_logs LIMIT 5)
UNION ALL
(SELECT 'Incident', incident_timestamp, description 
 FROM incidient_report LIMIT 5)
ORDER BY event_time DESC;

SELECT * FROM family_tree_view ORDER BY family_name, child_name;
SELECT * FROM siblings_view ORDER BY father_name, child_name;