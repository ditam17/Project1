-- ============================================
-- CODING PLATFORM DATABASE SCHEMA
-- Updated with terminal_output support
-- ============================================

DROP TABLE IF EXISTS test_results CASCADE;
DROP TABLE IF EXISTS plagiarism_results CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    login_id VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('student', 'teacher', 'admin')) NOT NULL,
    -- Semester is mandatory for students and teachers, NULL for College Administrators
    -- 'I' = First Semester (C programming), 'II' = Second Semester (C++ programming)
    semester VARCHAR(3) CHECK (semester IN ('I', 'II')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    CONSTRAINT semester_required_for_student_teacher CHECK (
        (role IN ('student', 'teacher') AND semester IS NOT NULL) OR
        (role = 'admin' AND semester IS NULL)
    )
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_login_id ON users(login_id);
CREATE INDEX idx_users_role_semester ON users(role, semester);

-- ============================================
-- QUESTIONS TABLE
-- ============================================
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    language VARCHAR(10) CHECK (language IN ('c', 'cpp', 'python', 'java')) NOT NULL,
    starter_code TEXT,
    test_cases JSONB NOT NULL DEFAULT '[]',
    time_limit INTEGER DEFAULT 2,
    memory_limit INTEGER DEFAULT 64,
    points INTEGER DEFAULT 10,
    created_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    -- 'assignment' questions count toward a student's required/graded work;
    -- 'practice' questions are optional extra practice shown in a separate
    -- student-facing list but graded the same way once submitted.
    category VARCHAR(20) CHECK (category IN ('assignment', 'practice')) NOT NULL DEFAULT 'assignment',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_language ON questions(language);
CREATE INDEX idx_questions_active ON questions(is_active);
CREATE INDEX idx_questions_category ON questions(category);

-- ============================================
-- SUBMISSIONS TABLE (Updated with terminal_output)
-- ============================================
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language VARCHAR(10) NOT NULL,
    output TEXT,
    terminal_output TEXT,  -- NEW: Stores student's actual terminal session output
    status VARCHAR(20) CHECK (status IN ('draft', 'submitted', 'graded')),
    score INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    memory_used_kb INTEGER,
    ip_address VARCHAR(45),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, question_id)
);

CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_question ON submissions(question_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at DESC);

-- ============================================
-- TEST RESULTS TABLE
-- ============================================
CREATE TABLE test_results (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
    test_case_index INTEGER NOT NULL,
    input TEXT,
    expected_output TEXT,
    actual_output TEXT,
    passed BOOLEAN NOT NULL,
    execution_time_ms INTEGER,
    file_results JSONB DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_test_results_submission ON test_results(submission_id);

-- ============================================
-- PLAGIARISM RESULTS TABLE
-- ============================================
CREATE TABLE plagiarism_results (
    id SERIAL PRIMARY KEY,
    student1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    similarity_score DECIMAL(5,2) NOT NULL,
    matched_lines TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student1_id, student2_id, question_id)
);

CREATE INDEX idx_plagiarism_question ON plagiarism_results(question_id);

-- ============================================
-- TEACHERS (password: Teacher@123)
-- Semester II currently has a single teacher assigned. Prof. Johnson,
-- Prof. Williams, Prof. Brown, and Prof. Davis were removed to keep
-- Semester II to one teacher account; Semester I teachers will be
-- added when the Teacher role work begins.
-- ============================================
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('teacher1', '$2b$10$9i0RcAXJCgu/V78HMqXMyO0tsA50pTP4Kv6DErUUR1BNUPfd2Fcky', 'Sushant Sir', 'teacher', 'II');
-- ============================================
-- OPTIONAL: Sample Semester I (C) teacher for testing the First Semester
-- teacher flow end-to-end. Password: Teacher@123 (hash freshly generated
-- and verified with bcryptjs to actually match this password).
-- ============================================
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('teacher.sem1', '$2b$10$cIC3GIhcf3Ybp6q9QCXm/OzmdWU5L8wx4OTWa3bwDc3SdtEM5onBS', 'Prof. Sharma', 'teacher', 'I');
-- ============================================
-- OPTIONAL: Demo College Administrator account.
-- Password: Admin@123 (hash freshly generated and verified with
-- bcryptjs to actually match this password). Note semester is NULL,
-- as required by the semester_required_for_student_teacher constraint.
-- ============================================
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('admin1', '$2b$10$mY3o8Uft8nj9WIu7kQzQLek6hVRgJO3nGKUXNbjKLu0d8eVgcbHsK', 'Registrar Office', 'admin', NULL);
-- ============================================
-- STUDENTS (30 real students - ALL with REAL bcrypt hashes)
-- Password: Student@123
-- The project is currently focused on Semester II (C++), so all existing
-- students are assigned Semester II. Semester I (C) students can be added
-- the same way with semester = 'I'.
-- ============================================
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('alisha.suwal', '$2b$10$OhibZTzNQDG6SMNRPy1EGe0yHh8vB5mJ/PN9nRCc3fEi7L.Na64HW', 'Alisha Suwal', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('aman.shankar', '$2b$10$7QpUxaCOvMfo/UYItuc9OOOb4djrNWkS81n3TB2tTEFdltmElgJim', 'Aman Shankar', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('anubhav.bhandari', '$2b$10$kwJ2mk1lYawXJoYVl0FUK.eSzK9n2zIjNybuBLxRe8m77XQA7I.22', 'Anubhav Bhandari', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('arpit.regmi', '$2b$10$WIT1BSN9yDKS.zNyUQlbLOgTdCytmwtTVoE5sb97Bb23mau/isEge', 'Arpit Regmi', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('ashim.chaudhary', '$2b$10$w.1dG35fHlubHnqFD5/kVePhXEIGZXjdfAtv3KJ/IoDZ.ZvR.v/wy', 'Ashim Chaudhary', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('asim.poudel', '$2b$10$DirXLAQM9PFWm54U6FXiIuutGY9xYMFs4oy9vKSDj93OOmuirB2mi', 'Asim Poudel', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('bikram.bohara', '$2b$10$YcmC76Z7tiT8iREk1Du7wuiJestvdzv6ekecaihOOr5tHpOIqQ.x2', 'Bikram Bohara', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('bipin.sanjel', '$2b$10$FKtDklm6FJU41mGqyRXSpO/xM40VL.sRY7rbDPb09VT6oU.KMbpRS', 'Bipin Sanjel', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('bisheshata.pyakurel', '$2b$10$PU8xGJs/SgmPyKLiZIJshOa.XvOm2A1zqWGMhVdTTkt3aTfPajaPm', 'Bisheshata Pyakurel', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('danial.shahi', '$2b$10$LlKAqDH6aCHz9V392S3rgecFjm8USuewccpxOn67juqFQDp8CVpYK', 'Danial Kumar Shahi', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('dipesh.mahato', '$2b$10$PU6exolluVIbvR3gRfcTwOHjvBOUc28d6BeyJsKa1/o2tVIimBxle', 'Dipesh Kumar Mahato', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('ditam.gupta', '$2b$10$R00rmCZAGBd7tdupSOOMbOkad/y1wEOqDE5e1QopExMg8NCCWphPW', 'Ditam Gupta', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('jiden.pandey', '$2b$10$bEXLynYu.DpBFjhBGbpWGeA5dwlYlb4O1UC.isULfGJRvFl9JxVfe', 'Jiden pandey', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('krishala.khadka', '$2b$10$UIie4u1A.LnceyevgUGepuzeRQ3rfI7C1iG2WqB4/qvp4uGj.y6yq', 'Krishala Khadka', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('lujah.maharjan', '$2b$10$vnXywnrdJts9w5VdVuquaOnWZNRZrDWX5Ft4M2k/DzRVPzyzDhIWi', 'Lujah Maharjan', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('palistha.shrestha', '$2b$10$JWrhkK25wwDAplb/cKJke.OMQz7/1hicch1yoN5xh2k4qK3aqjNQ6', 'Palistha Shrestha', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('prabin.sapkota', '$2b$10$ekBRUEc2QbIljx60fj6Hi.0/kkmV/vRxucNwlGEPqlO2AbpjuiWqa', 'Prabin Sapkota', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('prasant.gahatraj', '$2b$10$5XrX.jNS5neIxQsln8MLU.L9khPYuyqlcD9OxegPBX0TzoY4iMa3u', 'Prasant Gahatraj', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('rujan.kc', '$2b$10$eUZbxs7a.oKh81e8i.bT4.u7HNdfLkmCSfVGk/JlLfNnZGfbpapda', 'Rujan K.C.', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('sandip.sharki', '$2b$10$31kpmhnfWgxCOBzJQpLkvOG0zxmc13rkVL2b1L9MvOF6UXhGfXAIa', 'Sandip Sharki', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('saraswoti.thakur', '$2b$10$r9VUaGGcxw9yaOiI2ytnkeRkOU8Mc.o4uJQAfLWMSglOcUQwJ2MIa', 'Saraswoti Kumari Thakur', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('sijan.thapa', '$2b$10$BozN2FydaOhQGKpuq1ECfueBqNzQHpisi3b4qxB0IJgCi8bzwoCgK', 'Sijan Thapa', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('sonam.khatri', '$2b$10$rSXC72zgyADVv42iTlL.o.pwAg6SUVAsfuD2KPJ9VOz3iAbasUoFy', 'Sonam Khatri', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('sujan.gharti', '$2b$10$uO71r.r25j0oqGXmmji1LOtnXzh7lGBKwySEB6qihrGIQEQxxj1S.', 'Sujan Gharti', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('susan.sambahamphe', '$2b$10$w7K8R6xHwwe8AOOGKkcehuRqaGykZkGVfwwJtAuW38k9jyZpSY.b.', 'Susan sambahamphe', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('swastika.aryal', '$2b$10$VIBo6vNq1v9ZPrSTfnDKOuWGeyEFoLyfWsARY/KTC8EWQzcZyjkea', 'Swastika Aryal', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('swophnil.magar', '$2b$10$smtjlqKblIvkj69.8xthZ.PndmVVXc2ccMzfyClv8wjckJEUWmQrW', 'Swophnil Thapa Magar', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('unisha.ale', '$2b$10$QdJw3eiOlgzQwTQqJUYXDuQuUlIRHTGJk0XhWDrRnZMkVwrjosxD2', 'Unisha Ale', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('vijay.lama', '$2b$10$CfaWFiDoRGzYZ8lzdL06xeppvWuhQbtkQ/AS9r11JCUsCNm9oEnsy', 'Vijay Singh Lama', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('yoban.sahi', '$2b$10$GtKtyG2/YqhJp3yevzu/.OJVRjb01mojHpekQXcM8ikiSIQiMPdnC', 'Yoban sahi', 'student', 'II');

-- ============================================
-- OPTIONAL: Sample Semester I (C) student for testing the First Semester
-- flow end-to-end. Password: Student@123 (hash freshly generated and
-- verified with bcryptjs to actually match this password).
-- ============================================
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('sem1.demo', '$2a$12$KgvyKOsTN2BTJ951FdWEV.xilwmdZ8h3kZsLzBIcJkW4AKkOIXv/W', 'Semester I Demo Student', 'student', 'I');

-- ============================================
-- SAMPLE QUESTIONS - STDOUT-BASED
-- ============================================

-- -- 1. Hello World (C)
-- INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by) VALUES
-- ('Hello World', 'Write a program to print Hello World', 'c', E'#include <stdio.h>

-- int main() {
--     // Write your code here
--     printf("Hello, World!\n");
--     return 0;
-- }', '[{"input": "", "expected_output": "Hello, World!\n"}]', 2, 64, 10, 1);

-- -- 2. Sum of Two Numbers (C)
-- INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by) VALUES
-- ('Sum of Two Numbers', 'Write a program to add two integers', 'c', E'#include <stdio.h>

-- int main() {
--     int a, b;
--     scanf("%d %d", &a, &b);
--     printf("%d\n", a + b);
--     return 0;
-- }', '[{"input": "5 3\n", "expected_output": "8\n"}, {"input": "10 20\n", "expected_output": "30\n"}, {"input": "0 0\n", "expected_output": "0\n"}]', 2, 64, 15, 1);

-- -- 3. Factorial (C)
-- INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by) VALUES
-- ('Factorial', 'Calculate factorial of a number', 'c', E'#include <stdio.h>

-- int main() {
--     int n, i;
--     long long fact = 1;
--     scanf("%d", &n);
--     for(i = 1; i <= n; i++)
--         fact *= i;
--     printf("%lld\n", fact);
--     return 0;
-- }', '[{"input": "5\n", "expected_output": "120\n"}, {"input": "0\n", "expected_output": "1\n"}, {"input": "3\n", "expected_output": "6\n"}]', 2, 64, 20, 1);

-- 4. Hello World C++
INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by) VALUES
('Hello World C++', 'Write a program to print Hello World using C++', 'cpp', E'#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}', '[{"input": "", "expected_output": "Hello, World!\n"}]', 2, 64, 10, 1);

-- 5. Sum C++
INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by) VALUES
('Sum C++', 'Add two numbers using C++', 'cpp', E'#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}', '[{"input": "10 20\n", "expected_output": "30\n"}, {"input": "100 200\n", "expected_output": "300\n"}]', 2, 64, 15, 1);

-- ============================================
-- NEW: FILE-BASED QUESTIONS
-- ============================================

-- -- 6. Read and Write File (C) - FILE I/O
-- INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by) VALUES
-- ('File Reader Writer', 'Read two integers from "data.txt", calculate their sum, and write the result to "result.txt"', 'c', E'#include <stdio.h>

-- int main() {
--     FILE *in = fopen("data.txt", "r");
--     FILE *out = fopen("result.txt", "w");
--     int a, b;
--     fscanf(in, "%d %d", &a, &b);
--     fprintf(out, "%d\n", a + b);
--     fclose(in);
--     fclose(out);
--     return 0;
-- }', '[{"input": "", "expected_output": "", "input_files": {"data.txt": "5 3"}, "expected_files": {"result.txt": "8\n"}}, {"input": "", "expected_output": "", "input_files": {"data.txt": "100 200"}, "expected_files": {"result.txt": "300\n"}}]', 2, 64, 25, 1);

-- 7. Count Lines in File (C++) - FILE I/O
INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by) VALUES
('Count Lines', 'Read "input.txt" and write the number of lines to "output.txt"', 'cpp', E'#include <iostream>
#include <fstream>
#include <string>
using namespace std;

int main() {
    ifstream in("input.txt");
    ofstream out("output.txt");
    string line;
    int count = 0;
    while (getline(in, line)) {
        count++;
    }
    out << count << endl;
    return 0;
}', '[{"input": "", "expected_output": "", "input_files": {"input.txt": "line1\nline2\nline3\n"}, "expected_files": {"output.txt": "3\n"}}, {"input": "", "expected_output": "", "input_files": {"input.txt": "hello\nworld\n"}, "expected_files": {"output.txt": "2\n"}}]', 2, 64, 25, 1);

