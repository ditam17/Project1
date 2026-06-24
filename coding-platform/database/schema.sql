-- ============================================
-- CODING PLATFORM DATABASE SCHEMA
-- Optimized with indexes, audit fields, test results
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
    role VARCHAR(20) CHECK (role IN ('student', 'teacher')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_login_id ON users(login_id);

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
-- SUBMISSIONS TABLE
-- ============================================
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language VARCHAR(10) NOT NULL,
    output TEXT,
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
-- ============================================
INSERT INTO users (login_id, password_hash, name, role) VALUES
('teacher1', '$2a$10$fMayvUWaVTI/P7Tj7tent.exOg2TydPQ6BByzUaa.XjDgSx5cCBsO', 'Prof. Smith', 'teacher'),
('teacher2', '$2a$10$fMayvUWaVTI/P7Tj7tent.exOg2TydPQ6BByzUaa.XjDgSx5cCBsO', 'Prof. Johnson', 'teacher'),
('teacher3', '$2a$10$fMayvUWaVTI/P7Tj7tent.exOg2TydPQ6BByzUaa.XjDgSx5cCBsO', 'Prof. Williams', 'teacher'),
('teacher4', '$2a$10$fMayvUWaVTI/P7Tj7tent.exOg2TydPQ6BByzUaa.XjDgSx5cCBsO', 'Prof. Brown', 'teacher'),
('teacher5', '$2a$10$fMayvUWaVTI/P7Tj7tent.exOg2TydPQ6BByzUaa.XjDgSx5cCBsO', 'Prof. Davis', 'teacher');

-- ============================================
-- STUDENTS (30 real students - ALL with REAL bcrypt hashes)
-- ============================================
INSERT INTO users (login_id, password_hash, name, role) VALUES
('alisha.suwal', '$2b$12$AuChfZAM9HW4Sgw2gopyrOX5RLf5pPRO83xjtMgqqqDWWNa8kWlR2', 'Alisha Suwal', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('aman.shankar', '$2b$12$XH52boi8673AzNgjPOblruwOCw1wyEJbenk7w84oJ5bRIjic/XlcS', 'Aman Shankar', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('anubhav.bhandari', '$2b$12$0AwsPTmaazEOYihEWfRxh.RcQg.YbiS19fxkXpP1w12UPFwAxxhY2', 'Anubhav Bhandari', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('arpit.regmi', '$2b$12$Mkzk4uadTFwvvY4rAA6JR.7enMbSKubuGbrEiF/vvhIaBtDFOtuVe', 'Arpit Regmi', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('ashim.chaudhary', '$2b$12$AAAiKyOy4whe/jF2QwiyUOnu8dG2Hy8NEM.h9gAKWSmO998WceEAO', 'Ashim Chaudhary', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('asim.poudel', '$2b$12$5BUnd2VzB5qJr7t.qVnUHODZJfjUmrLilxYDLBaKclL3oPyK4Hw/G', 'Asim Poudel', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('bikram.bohara', '$2b$12$qC351fGbRe8aPWDZtYMXp.xVbMzZLb0H6TngAWsu/N72SiNkBK0u.', 'Bikram Bohara', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('bipin.sanjel', '$2b$12$YT6CcoUUeMAaJI9tvHHI7uhWClo3ZTBWb7vkJ9OxihuonzLrD88CO', 'Bipin Sanjel', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('bisheshata.pyakurel', '$2b$12$u5oT.WSMtVH31ci3tlZLfepPYNCW9GmKA2wQ00rsEz1nJSqsiTWAi', 'Bisheshata Pyakurel', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('danial.shahi', '$2b$12$Vq2a4Jr406hhlisOWAu0q.4j4hODiaJZtULbPEYRZSgAODKoL9r5q', 'Danial Kumar Shahi', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('dipesh.mahato', '$2b$12$yvi3GKv2pubeoXuCXOQ.ROxhhgYc5/GqPhhfmZhjDC61N6/4jF7qW', 'Dipesh Kumar Mahato', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('ditam.gupta', '$2b$12$HLj5lHNOu3QcO02nBDza1OGiqmy/hRWJ6rv0OEfCSWBVX4sZAYGTi', 'Ditam Gupta', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('jiden.pandey', '$2b$12$DeS7C8jThANehVr4hJOn7ex0sa/Tsa1OwdEmqqCa9jRLL11xxvvvi', 'Jiden pandey', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('krishala.khadka', '$2b$12$jFZWKzHF2XeMabCR7srhTe39w2NXmQl3DCE9FPzklMn51qSKUL/xG', 'Krishala Khadka', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('lujah.maharjan', '$2b$12$XKteLoHzraujQefE513H.O1afWI9PN7Lsvd0S63/lQS2C/fW0VNee', 'Lujah Maharjan', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('palistha.shrestha', '$2b$12$qrDtB6TwkKo/XOHdR1oqA.HfAtf36MvM6K82M09Qgr52umrHuIYe2', 'Palistha Shrestha', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('prabin.sapkota', '$2b$12$uN68MAXlsZxxSfMf4sLxAumz09puI0T0JJZnRtdEiYXdAaReLbWoW', 'Prabin Sapkota', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('prasant.gahatraj', '$2b$12$pN7Bdq41KSHBg7O28cwSOuaWVZP.e0SMjDZlwF2wOFiIS8RSTe5ZS', 'Prasant Gahatraj', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('rujan.kc', '$2b$12$ET6q7mq6Oxq3Ihffb/gWC.HUZwMAis3VO1m3O56ldkSF32BSyWDYW', 'Rujan K.C.', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('sandip.sharki', '$2b$12$vkq0ep7vAe4CxqysNZSE0eLiY9WMEpNTysOkbalCcX1wWAWDOZfd2', 'Sandip Sharki', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('saraswoti.thakur', '$2b$12$ZAD/Nofp0f0F7RT11OTLNOnqxqJdWWHws7b6xc7aCgmCWLnLqyWB6', 'Saraswoti Kumari Thakur', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('sijan.thapa', '$2b$12$JiO.jiufaNVS.BkzgeIsmutthSBghd4nJVeRhkO4vkDgCL/ZmBQbG', 'Sijan Thapa', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('sonam.khatri', '$2b$12$0l52hf.DkItQmpLwqHvbx.4ePIdWLy7PNCHCYPeBLgjkZ3nA1xOMy', 'Sonam Khatri', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('sujan.gharti', '$2b$12$QGIS37pmX5PHUQ7bwcsb/.MPO38OdiLpTX2t7HomausUNMn3uRmwG', 'Sujan Gharti', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('susan.sambahamphe', '$2b$12$arc8zUW2PVwEKFuFzgR0iOc0dNDdRHq6SqZbcI//LmWGkFJgBl4Rm', 'Susan sambahamphe', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('swastika.aryal', '$2b$12$FuiXpCn2ufAn.yFY9D.zd.1OnoiwsVslIzLyRUyv/HeNkuSVH/B/6', 'Swastika Aryal', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('swophnil.magar', '$2b$12$/ftd0QS6XTQ2hVdvPWDx6uZNWMllcfLDs9UX8NSbMzqcPsHvXRdu6', 'Swophnil Thapa Magar', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('unisha.ale', '$2b$12$pGMwIReAkLn0B2mO3CI16.OavdC1Iqppm9CRc0/a7JZnJKkINzGfS', 'Unisha Ale', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('vijay.lama', '$2b$12$Shj.dOYZ706WCfDV8pLDf.MJJpU0Edr4VNJvJ7zGGiMlJN2N96rk6', 'Vijay Singh Lama', 'student');
INSERT INTO users (login_id, password_hash, name, role) VALUES
('yoban.sahi', '$2b$12$P3GKcnZrZOtDuPsqLd4UXOsb8RfBq2M8a1HxAh28s/Q7scECCQLNu', 'Yoban sahi', 'student');

-- ============================================
-- SAMPLE QUESTIONS WITH TEST CASES
-- ============================================
INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by) VALUES
('Hello World', 'Write a program to print Hello World', 'c', E'#include <stdio.h>

int main() {
    // Write your code here
    printf("Hello, World!\n");
    return 0;
}', '[{"input": "", "expected_output": "Hello, World!\n"}]', 2, 64, 10, 1);

INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by) VALUES
('Sum of Two Numbers', 'Write a program to add two integers', 'c', E'#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\n", a + b);
    return 0;
}', '[{"input": "5 3\n", "expected_output": "8\n"}, {"input": "10 20\n", "expected_output": "30\n"}, {"input": "0 0\n", "expected_output": "0\n"}]', 2, 64, 15, 1);

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

INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by) VALUES
('Hello World C++', 'Write a program to print Hello World using C++', 'cpp', E'#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}', '[{"input": "", "expected_output": "Hello, World!\n"}]', 2, 64, 10, 1);

INSERT INTO questions (title, description, language, starter_code, test_cases, time_limit, memory_limit, points, created_by) VALUES
('Sum C++', 'Add two numbers using C++', 'cpp', E'#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}', '[{"input": "10 20\n", "expected_output": "30\n"}, {"input": "100 200\n", "expected_output": "300\n"}]', 2, 64, 15, 1);