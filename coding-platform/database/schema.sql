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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_language ON questions(language);
CREATE INDEX idx_questions_active ON questions(is_active);

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
-- All currently assigned Semester II for now; Semester I teachers will be
-- added when the Teacher role work begins.
-- ============================================
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('teacher1', '$2a$10$fMayvUWaVTI/P7Tj7tent.exOg2TydPQ6BByzUaa.XjDgSx5cCBsO', 'Prof. Smith', 'teacher', 'II'),
('teacher2', '$2a$10$fMayvUWaVTI/P7Tj7tent.exOg2TydPQ6BByzUaa.XjDgSx5cCBsO', 'Prof. Johnson', 'teacher', 'II'),
('teacher3', '$2a$10$fMayvUWaVTI/P7Tj7tent.exOg2TydPQ6BByzUaa.XjDgSx5cCBsO', 'Prof. Williams', 'teacher', 'II'),
('teacher4', '$2a$10$fMayvUWaVTI/P7Tj7tent.exOg2TydPQ6BByzUaa.XjDgSx5cCBsO', 'Prof. Brown', 'teacher', 'II'),
('teacher5', '$2a$10$fMayvUWaVTI/P7Tj7tent.exOg2TydPQ6BByzUaa.XjDgSx5cCBsO', 'Prof. Davis', 'teacher', 'II');
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
('alisha.suwal', '$2b$12$AuChfZAM9HW4Sgw2gopyrOX5RLf5pPRO83xjtMgqqqDWWNa8kWlR2', 'Alisha Suwal', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('aman.shankar', '$2b$12$XH52boi8673AzNgjPOblruwOCw1wyEJbenk7w84oJ5bRIjic/XlcS', 'Aman Shankar', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('anubhav.bhandari', '$2b$12$0AwsPTmaazEOYihEWfRxh.RcQg.YbiS19fxkXpP1w12UPFwAxxhY2', 'Anubhav Bhandari', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('arpit.regmi', '$2b$12$Mkzk4uadTFwvvY4rAA6JR.7enMbSKubuGbrEiF/vvhIaBtDFOtuVe', 'Arpit Regmi', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('ashim.chaudhary', '$2b$12$AAAiKyOy4whe/jF2QwiyUOnu8dG2Hy8NEM.h9gAKWSmO998WceEAO', 'Ashim Chaudhary', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('asim.poudel', '$2b$12$5BUnd2VzB5qJr7t.qVnUHODZJfjUmrLilxYDLBaKclL3oPyK4Hw/G', 'Asim Poudel', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('bikram.bohara', '$2b$12$qC351fGbRe8aPWDZtYMXp.xVbMzZLb0H6TngAWsu/N72SiNkBK0u.', 'Bikram Bohara', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('bipin.sanjel', '$2b$12$YT6CcoUUeMAaJI9tvHHI7uhWClo3ZTBWb7vkJ9OxihuonzLrD88CO', 'Bipin Sanjel', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('bisheshata.pyakurel', '$2b$12$u5oT.WSMtVH31ci3tlZLfepPYNCW9GmKA2wQ00rsEz1nJSqsiTWAi', 'Bisheshata Pyakurel', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('danial.shahi', '$2b$12$Vq2a4Jr406hhlisOWAu0q.4j4hODiaJZtULbPEYRZSgAODKoL9r5q', 'Danial Kumar Shahi', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('dipesh.mahato', '$2b$12$yvi3GKv2pubeoXuCXOQ.ROxhhgYc5/GqPhhfmZhjDC61N6/4jF7qW', 'Dipesh Kumar Mahato', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('ditam.gupta', '$2b$12$HLj5lHNOu3QcO02nBDza1OGiqmy/hRWJ6rv0OEfCSWBVX4sZAYGTi', 'Ditam Gupta', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('jiden.pandey', '$2b$12$DeS7C8jThANehVr4hJOn7ex0sa/Tsa1OwdEmqqCa9jRLL11xxvvvi', 'Jiden pandey', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('krishala.khadka', '$2b$12$jFZWKzHF2XeMabCR7srhTe39w2NXmQl3DCE9FPzklMn51qSKUL/xG', 'Krishala Khadka', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('lujah.maharjan', '$2b$12$XKteLoHzraujQefE513H.O1afWI9PN7Lsvd0S63/lQS2C/fW0VNee', 'Lujah Maharjan', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('palistha.shrestha', '$2b$12$qrDtB6TwkKo/XOHdR1oqA.HfAtf36MvM6K82M09Qgr52umrHuIYe2', 'Palistha Shrestha', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('prabin.sapkota', '$2b$12$uN68MAXlsZxxSfMf4sLxAumz09puI0T0JJZnRtdEiYXdAaReLbWoW', 'Prabin Sapkota', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('prasant.gahatraj', '$2b$12$pN7Bdq41KSHBg7O28cwSOuaWVZP.e0SMjDZlwF2wOFiIS8RSTe5ZS', 'Prasant Gahatraj', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('rujan.kc', '$2b$12$ET6q7mq6Oxq3Ihffb/gWC.HUZwMAis3VO1m3O56ldkSF32BSyWDYW', 'Rujan K.C.', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('sandip.sharki', '$2b$12$vkq0ep7vAe4CxqysNZSE0eLiY9WMEpNTysOkbalCcX1wWAWDOZfd2', 'Sandip Sharki', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('saraswoti.thakur', '$2b$12$ZAD/Nofp0f0F7RT11OTLNOnqxqJdWWHws7b6xc7aCgmCWLnLqyWB6', 'Saraswoti Kumari Thakur', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('sijan.thapa', '$2b$12$JiO.jiufaNVS.BkzgeIsmutthSBghd4nJVeRhkO4vkDgCL/ZmBQbG', 'Sijan Thapa', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('sonam.khatri', '$2b$12$0l52hf.DkItQmpLwqHvbx.4ePIdWLy7PNCHCYPeBLgjkZ3nA1xOMy', 'Sonam Khatri', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('sujan.gharti', '$2b$12$QGIS37pmX5PHUQ7bwcsb/.MPO38OdiLpTX2t7HomausUNMn3uRmwG', 'Sujan Gharti', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('susan.sambahamphe', '$2b$12$arc8zUW2PVwEKFuFzgR0iOc0dNDdRHq6SqZbcI//LmWGkFJgBl4Rm', 'Susan sambahamphe', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('swastika.aryal', '$2b$12$FuiXpCn2ufAn.yFY9D.zd.1OnoiwsVslIzLyRUyv/HeNkuSVH/B/6', 'Swastika Aryal', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('swophnil.magar', '$2b$12$/ftd0QS6XTQ2hVdvPWDx6uZNWMllcfLDs9UX8NSbMzqcPsHvXRdu6', 'Swophnil Thapa Magar', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('unisha.ale', '$2b$12$pGMwIReAkLn0B2mO3CI16.OavdC1Iqppm9CRc0/a7JZnJKkINzGfS', 'Unisha Ale', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('vijay.lama', '$2b$12$Shj.dOYZ706WCfDV8pLDf.MJJpU0Edr4VNJvJ7zGGiMlJN2N96rk6', 'Vijay Singh Lama', 'student', 'II');
INSERT INTO users (login_id, password_hash, name, role, semester) VALUES
('yoban.sahi', '$2b$12$P3GKcnZrZOtDuPsqLd4UXOsb8RfBq2M8a1HxAh28s/Q7scECCQLNu', 'Yoban sahi', 'student', 'II');

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

-- 1. Hello World (C)
INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by) VALUES
('Hello World', 'Write a program to print Hello World', 'c', E'#include <stdio.h>

int main() {
    // Write your code here
    printf("Hello, World!\n");
    return 0;
}', '[{"input": "", "expected_output": "Hello, World!\n"}]', 2, 64, 10, 1);

-- 2. Sum of Two Numbers (C)
INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by) VALUES
('Sum of Two Numbers', 'Write a program to add two integers', 'c', E'#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\n", a + b);
    return 0;
}', '[{"input": "5 3\n", "expected_output": "8\n"}, {"input": "10 20\n", "expected_output": "30\n"}, {"input": "0 0\n", "expected_output": "0\n"}]', 2, 64, 15, 1);

-- 3. Factorial (C)
INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by) VALUES
('Factorial', 'Calculate factorial of a number', 'c', E'#include <stdio.h>

int main() {
    int n, i;
    long long fact = 1;
    scanf("%d", &n);
    for(i = 1; i <= n; i++)
        fact *= i;
    printf("%lld\n", fact);
    return 0;
}', '[{"input": "5\n", "expected_output": "120\n"}, {"input": "0\n", "expected_output": "1\n"}, {"input": "3\n", "expected_output": "6\n"}]', 2, 64, 20, 1);

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

-- 6. Read and Write File (C) - FILE I/O
INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by) VALUES
('File Reader Writer', 'Read two integers from "data.txt", calculate their sum, and write the result to "result.txt"', 'c', E'#include <stdio.h>

int main() {
    FILE *in = fopen("data.txt", "r");
    FILE *out = fopen("result.txt", "w");
    int a, b;
    fscanf(in, "%d %d", &a, &b);
    fprintf(out, "%d\n", a + b);
    fclose(in);
    fclose(out);
    return 0;
}', '[{"input": "", "expected_output": "", "input_files": {"data.txt": "5 3"}, "expected_files": {"result.txt": "8\n"}}, {"input": "", "expected_output": "", "input_files": {"data.txt": "100 200"}, "expected_files": {"result.txt": "300\n"}}]', 2, 64, 25, 1);

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

-- 8. Python File Processing
INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by) VALUES
('File Word Counter', 'Read "text.txt" and write the word count to "count.txt"', 'python', 'with open("text.txt", "r") as f:
    text = f.read()

words = text.split()
count = len(words)

with open("count.txt", "w") as f:
    f.write(str(count) + "\n")
', '[{"input": "", "expected_output": "", "input_files": {"text.txt": "hello world test"}, "expected_files": {"count.txt": "3\n"}}, {"input": "", "expected_output": "", "input_files": {"text.txt": "one two three four five"}, "expected_files": {"count.txt": "5\n"}}]', 2, 64, 25, 1);

-- 9. Java File I/O
INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by) VALUES
('Java File Copy', 'Read "source.txt" and copy its content to "destination.txt"', 'java', E'import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new FileReader("source.txt"));
        BufferedWriter writer = new BufferedWriter(new FileWriter("destination.txt"));
        String line;
        while ((line = reader.readLine()) != null) {
            writer.write(line);
            writer.newLine();
        }
        reader.close();
        writer.close();
    }
}', '[{"input": "", "expected_output": "", "input_files": {"source.txt": "Hello\nWorld\n"}, "expected_files": {"destination.txt": "Hello\nWorld\n"}}]', 2, 64, 25, 1);