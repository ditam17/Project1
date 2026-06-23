DROP TABLE IF EXISTS plagiarism_results CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    login_id VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('student', 'teacher')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    language VARCHAR(10) CHECK (language IN ('c', 'cpp')) NOT NULL,
    starter_code TEXT,
    test_cases JSONB,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    question_id INTEGER REFERENCES questions(id),
    code TEXT NOT NULL,
    language VARCHAR(10) NOT NULL,
    output TEXT,
    status VARCHAR(20) CHECK (status IN ('draft', 'submitted', 'graded')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, question_id)
);

CREATE TABLE plagiarism_results (
    id SERIAL PRIMARY KEY,
    student1_id INTEGER REFERENCES users(id),
    student2_id INTEGER REFERENCES users(id),
    question_id INTEGER REFERENCES questions(id),
    similarity_score DECIMAL(5,2) NOT NULL,
    matched_lines TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student1_id, student2_id, question_id)
);

INSERT INTO users (login_id, password_hash, name, role) VALUES
('teacher1', '$2a$10$fMayvUWaVTI/P7Tj7tent.exOg2TydPQ6BByzUaa.XjDgSx5cCBsO', 'Prof. Smith', 'teacher'),
('teacher2', '$2a$10$fMayvUWaVTI/P7Tj7tent.exOg2TydPQ6BByzUaa.XjDgSx5cCBsO', 'Prof. Johnson', 'teacher'),
('teacher3', '$2a$10$fMayvUWaVTI/P7Tj7tent.exOg2TydPQ6BByzUaa.XjDgSx5cCBsO', 'Prof. Williams', 'teacher'),
('teacher4', '$2a$10$fMayvUWaVTI/P7Tj7tent.exOg2TydPQ6BByzUaa.XjDgSx5cCBsO', 'Prof. Brown', 'teacher'),
('teacher5', '$2a$10$fMayvUWaVTI/P7Tj7tent.exOg2TydPQ6BByzUaa.XjDgSx5cCBsO', 'Prof. Davis', 'teacher');

INSERT INTO users (login_id, password_hash, name, role) VALUES
('student01', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Alice Anderson', 'student'),
('student02', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Bob Baker', 'student'),
('student03', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Charlie Clark', 'student'),
('student04', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Diana Davis', 'student'),
('student05', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Eve Evans', 'student'),
('student06', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Frank Foster', 'student'),
('student07', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Grace Green', 'student'),
('student08', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Henry Harris', 'student'),
('student09', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Ivy Irving', 'student'),
('student10', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Jack Johnson', 'student'),
('student11', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Kate King', 'student'),
('student12', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Leo Lewis', 'student'),
('student13', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Mia Miller', 'student'),
('student14', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Noah Nelson', 'student'),
('student15', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Olivia Owens', 'student'),
('student16', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Paul Parker', 'student'),
('student17', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Quinn Quinn', 'student'),
('student18', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Ryan Roberts', 'student'),
('student19', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Sarah Scott', 'student'),
('student20', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Tom Turner', 'student'),
('student21', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Uma Underwood', 'student'),
('student22', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Victor Vaughn', 'student'),
('student23', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Wendy White', 'student'),
('student24', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Xavier Xiong', 'student'),
('student25', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Yara Young', 'student'),
('student26', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Zack Zimmerman', 'student'),
('student27', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Amy Adams', 'student'),
('student28', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Ben Brooks', 'student'),
('student29', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Cara Collins', 'student'),
('student30', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Dan Daniels', 'student'),
('student31', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Ella Edwards', 'student'),
('student32', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Finn Fisher', 'student'),
('student33', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Gina Garcia', 'student'),
('student34', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Hugo Hughes', 'student'),
('student35', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Iris Ingram', 'student'),
('student36', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Jake Jenkins', 'student'),
('student37', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Kelly Kim', 'student'),
('student38', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Liam Lee', 'student'),
('student39', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Maya Martinez', 'student'),
('student40', '$2a$10$A0SoNenPKfidj9UVaBGiB.iOROccmh6Nsni5pc9hysBNwZe1eBxFy', 'Nathan Nguyen', 'student');

INSERT INTO questions (title, description, language, starter_code, test_cases, created_by) VALUES
('Hello World', 'Write a program to print Hello World', 'c', E'#include <stdio.h>\n\nint main() {\n    // Write your code here\n    \n    return 0;\n}', '[{"input": "", "expected_output": "Hello, World!"}]', 1);

INSERT INTO questions (title, description, language, starter_code, test_cases, created_by) VALUES
('Sum of Two Numbers', 'Write a program to add two integers', 'c', E'#include <stdio.h>\n\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    // Write your code here\n    \n    return 0;\n}', '[{"input": "5 3", "expected_output": "8"}]', 1);

INSERT INTO questions (title, description, language, starter_code, test_cases, created_by) VALUES
('Factorial', 'Calculate factorial of a number', 'c', E'#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // Write your code here\n    \n    return 0;\n}', '[{"input": "5", "expected_output": "120"}]', 1);

INSERT INTO questions (title, description, language, starter_code, test_cases, created_by) VALUES
('Hello World C++', 'Write a program to print Hello World using C++', 'cpp', E'#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    \n    return 0;\n}', '[{"input": "", "expected_output": "Hello, World!"}]', 1);

INSERT INTO questions (title, description, language, starter_code, test_cases, created_by) VALUES
('Sum C++', 'Add two numbers using C++', 'cpp', E'#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    // Write your code here\n    \n    return 0;\n}', '[{"input": "10 20", "expected_output": "30"}]', 1);