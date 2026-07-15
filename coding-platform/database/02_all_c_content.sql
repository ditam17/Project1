-- Adds chapter grouping to existing questions without touching any data.
-- Existing rows get chapter = NULL, which the frontend will bucket under "General".
ALTER TABLE questions ADD COLUMN IF NOT EXISTS chapter VARCHAR(150);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter);
-- ============================================================
-- C PROGRAMMING QUESTIONS — Chapters 2 through 8
-- CSIT 104 (Computer Concept and Programming), Semester I
-- 10 questions per chapter, 70 total. Chapter 1 skipped per
-- instruction (Computer Fundamentals — no programming content).
-- Chapter 9 (Introduction to Graphics) is handled separately —
-- see note at the end of this file.
--
-- created_by resolves to the Semester I teacher (Prof. Sharma)
-- by login_id, not a hardcoded numeric id, so this runs safely
-- regardless of the live DB's actual user ids.
-- Run this AFTER add_chapter_column.sql has been applied.
-- ============================================================

-- ============================================================
-- CHAPTER: Overview of C Language
-- ============================================================

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Print Variable Types', 'WAP to declare int, float and char variables, read their values, and print them.', 'c', 'Overview of C Language',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "10 3.5 A\n", "expected_output": "Int: 10\nFloat: 3.50\nChar: A\n"}, {"input": "5 2.25 z\n", "expected_output": "Int: 5\nFloat: 2.25\nChar: z\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Implicit Type Conversion', 'WAP to read an integer and a float, add them together, and print the sum (implicit conversion applies).', 'c', 'Overview of C Language',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5 2.5\n", "expected_output": "7.50\n"}, {"input": "10 0.25\n", "expected_output": "10.25\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Explicit Type Casting', 'WAP to read a float value and print it alongside its explicitly cast integer value.', 'c', 'Overview of C Language',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "9.7\n", "expected_output": "Float: 9.70\nInt: 9\n"}, {"input": "3.2\n", "expected_output": "Float: 3.20\nInt: 3\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Size of Data Types', 'WAP to print the size (in bytes) of int, float, char and double using the sizeof operator.', 'c', 'Overview of C Language',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "int: 4\nfloat: 4\nchar: 1\ndouble: 8\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Swap Without Third Variable', 'WAP to swap two numbers without using a third (temporary) variable.', 'c', 'Overview of C Language',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5 10\n", "expected_output": "10 5\n"}, {"input": "1 2\n", "expected_output": "2 1\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Arithmetic Operators', 'WAP to read two integers and print their sum, difference, product, quotient, and remainder.', 'c', 'Overview of C Language',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "10 3\n", "expected_output": "Sum: 13\nDifference: 7\nProduct: 30\nQuotient: 3\nRemainder: 1\n"}, {"input": "20 4\n", "expected_output": "Sum: 24\nDifference: 16\nProduct: 80\nQuotient: 5\nRemainder: 0\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Relational and Logical Operators', 'WAP to read two integers a and b, then print (in order, space separated) the results of a>b, a<b, a==b and (a>0 && b>0) as 1 or 0.', 'c', 'Overview of C Language',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5 3\n", "expected_output": "1 0 0 1\n"}, {"input": "-2 3\n", "expected_output": "0 1 0 0\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Increment and Decrement Operators', 'WAP to read an integer n and demonstrate post-increment and pre-decrement, printing the value at each stage as shown.', 'c', 'Overview of C Language',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n", "expected_output": "Post-increment: 5\nAfter post-increment: 6\nPre-decrement: 5\n"}, {"input": "10\n", "expected_output": "Post-increment: 10\nAfter post-increment: 11\nPre-decrement: 10\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('ASCII Value of a Character', 'WAP to read a character and print its ASCII (integer) value.', 'c', 'Overview of C Language',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "A\n", "expected_output": "65\n"}, {"input": "a\n", "expected_output": "97\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Largest of Two Using Ternary', 'WAP to read two numbers and print the larger one using the ternary operator.', 'c', 'Overview of C Language',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5 9\n", "expected_output": "9\n"}, {"input": "12 4\n", "expected_output": "12\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

-- ============================================================
-- CHAPTER: Control Structures
-- ============================================================

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Even or Odd', 'WAP to check whether a given number is even or odd.', 'c', 'Control Structures',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "7\n", "expected_output": "Odd\n"}, {"input": "10\n", "expected_output": "Even\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Positive, Negative or Zero', 'WAP to check whether a number is positive, negative, or zero.', 'c', 'Control Structures',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n", "expected_output": "Positive\n"}, {"input": "-3\n", "expected_output": "Negative\n"}, {"input": "0\n", "expected_output": "Zero\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Largest of Three Numbers', 'WAP to find the largest of three numbers using nested if-else.', 'c', 'Control Structures',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3 9 6\n", "expected_output": "9\n"}, {"input": "10 2 15\n", "expected_output": "15\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Menu-Based Calculator', 'WAP to read two integers a and an operator (+, -, *, /) and b, then print the result of applying the operator using a switch statement. Division should print a value with 2 decimal places; other operations print a plain integer.', 'c', 'Control Structures',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "10 + 5\n", "expected_output": "15\n"}, {"input": "10 / 4\n", "expected_output": "2.50\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Multiplication Table', 'WAP to print the multiplication table (1 to 10) of a given number using a for loop, in the format "n x i = result".', 'c', 'Control Structures',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n", "expected_output": "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50\n"}, {"input": "2\n", "expected_output": "2 x 1 = 2\n2 x 2 = 4\n2 x 3 = 6\n2 x 4 = 8\n2 x 5 = 10\n2 x 6 = 12\n2 x 7 = 14\n2 x 8 = 16\n2 x 9 = 18\n2 x 10 = 20\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Sum of Natural Numbers (While Loop)', 'WAP to compute the sum of the first N natural numbers using a while loop.', 'c', 'Control Structures',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n", "expected_output": "15\n"}, {"input": "10\n", "expected_output": "55\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Sum of Natural Numbers (Do-While Loop)', 'WAP to compute the sum of the first N natural numbers using a do-while loop.', 'c', 'Control Structures',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n", "expected_output": "15\n"}, {"input": "1\n", "expected_output": "1\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Prime Numbers Up To N', 'WAP to print all prime numbers between 1 and N (inclusive), space-separated on one line.', 'c', 'Control Structures',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "10\n", "expected_output": "2 3 5 7\n"}, {"input": "20\n", "expected_output": "2 3 5 7 11 13 17 19\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Palindrome Number Check', 'WAP to check whether a given number is a palindrome using loops (no string conversion).', 'c', 'Control Structures',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "121\n", "expected_output": "Palindrome\n"}, {"input": "123\n", "expected_output": "Not Palindrome\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Fibonacci Series', 'WAP to print the Fibonacci series up to N terms, space-separated on one line, starting from 0.', 'c', 'Control Structures',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n", "expected_output": "0 1 1 2 3\n"}, {"input": "7\n", "expected_output": "0 1 1 2 3 5 8\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

-- ============================================================
-- CHAPTER: Arrays and Strings
-- ============================================================

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Largest Element in Array', 'WAP to find the largest element in an array of integers.', 'c', 'Arrays and Strings',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n3 7 2 9 4\n", "expected_output": "9\n"}, {"input": "3\n-1 -5 -2\n", "expected_output": "-1\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Reverse a String', 'WAP to reverse a string without using any built-in string-reversal function.', 'c', 'Arrays and Strings',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "hello\n", "expected_output": "olleh\n"}, {"input": "csit\n", "expected_output": "tisc\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Sum and Average of Array', 'WAP to find the sum and average of the elements of an array.', 'c', 'Arrays and Strings',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n1 2 3 4 5\n", "expected_output": "Sum: 15\nAverage: 3.00\n"}, {"input": "3\n10 20 30\n", "expected_output": "Sum: 60\nAverage: 20.00\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Linear Search', 'WAP to search for an element in an array using linear search and print the index if found (0-based), or "Not Found".', 'c', 'Arrays and Strings',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n3 7 2 9 4\n9\n", "expected_output": "Found at index 3\n"}, {"input": "4\n1 2 3 4\n10\n", "expected_output": "Not Found\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Bubble Sort', 'WAP to sort an array in ascending order using bubble sort.', 'c', 'Arrays and Strings',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n5 2 4 1 3\n", "expected_output": "1 2 3 4 5\n"}, {"input": "4\n9 1 8 2\n", "expected_output": "1 2 8 9\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Second Largest Element', 'WAP to find the second largest distinct element in an array.', 'c', 'Arrays and Strings',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n3 7 2 9 4\n", "expected_output": "7\n"}, {"input": "4\n1 5 9 3\n", "expected_output": "5\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Palindrome String Check', 'WAP to check whether a given string is a palindrome.', 'c', 'Arrays and Strings',
E'#include <stdio.h>
#include <string.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "madam\n", "expected_output": "Palindrome\n"}, {"input": "hello\n", "expected_output": "Not Palindrome\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Count Vowels and Consonants', 'WAP to count the number of vowels and consonants in a string (ignore spaces).', 'c', 'Arrays and Strings',
E'#include <stdio.h>
#include <ctype.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "hello world\n", "expected_output": "Vowels: 3\nConsonants: 7\n"}, {"input": "csit\n", "expected_output": "Vowels: 1\nConsonants: 3\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Add Two Matrices', 'WAP to add two 2x2 matrices using two-dimensional arrays. Input gives matrix A''s 4 values then matrix B''s 4 values, each on its own line, row-major order.', 'c', 'Arrays and Strings',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "1 2 3 4\n5 6 7 8\n", "expected_output": "6 8\n10 12\n"}, {"input": "1 1 1 1\n2 2 2 2\n", "expected_output": "3 3\n3 3\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('String Concatenation Without strcat', 'WAP to concatenate two strings (read as two separate words, no spaces) without using the strcat() library function.', 'c', 'Arrays and Strings',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "Hello\nWorld\n", "expected_output": "HelloWorld\n"}, {"input": "Nepal\nRocks\n", "expected_output": "NepalRocks\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

-- ============================================================
-- CHAPTER: Functions
-- ============================================================

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Prime Check Using a Function', 'WAP using a separate function to check whether a number is prime.', 'c', 'Functions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "7\n", "expected_output": "Prime\n"}, {"input": "10\n", "expected_output": "Not Prime\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Factorial Using Recursion', 'WAP using a recursive function to calculate the factorial of a number.', 'c', 'Functions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n", "expected_output": "120\n"}, {"input": "0\n", "expected_output": "1\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('GCD Using Recursion', 'WAP using a recursive function to find the GCD of two numbers.', 'c', 'Functions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "12 18\n", "expected_output": "6\n"}, {"input": "35 14\n", "expected_output": "7\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Fibonacci Term Using Recursion', 'WAP using a recursive function to find the Fibonacci number at a given 0-based position (0, 1, 1, 2, 3, 5, 8, ...).', 'c', 'Functions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "6\n", "expected_output": "8\n"}, {"input": "0\n", "expected_output": "0\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Sum of Digits Using a Function', 'WAP using a function that returns the sum of the digits of a number.', 'c', 'Functions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "12345\n", "expected_output": "15\n"}, {"input": "9\n", "expected_output": "9\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Swap Using Call by Reference', 'WAP using a function that swaps two numbers via call by reference (pass pointers as parameters).', 'c', 'Functions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3 8\n", "expected_output": "8 3\n"}, {"input": "1 2\n", "expected_output": "2 1\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Maximum in Array Using a Function', 'WAP using a function that receives an array and its size, and returns the maximum element.', 'c', 'Functions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n4 8 1 9 3\n", "expected_output": "9\n"}, {"input": "3\n10 2 6\n", "expected_output": "10\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Armstrong Number Using a Function', 'WAP using a function to check whether a given number is an Armstrong number.', 'c', 'Functions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "153\n", "expected_output": "Armstrong\n"}, {"input": "123\n", "expected_output": "Not Armstrong\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Macro Square and Function Cube', 'WAP that defines a preprocessor macro to compute the square of a number and a separate function to compute the cube, then prints both for a given input.', 'c', 'Functions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "4\n", "expected_output": "Square: 16\nCube: 64\n"}, {"input": "3\n", "expected_output": "Square: 9\nCube: 27\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Power Using Recursion', 'WAP using a recursive function to compute x raised to the power n.', 'c', 'Functions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "2 10\n", "expected_output": "1024\n"}, {"input": "5 3\n", "expected_output": "125\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

-- ============================================================
-- CHAPTER: Pointers
-- ============================================================

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Access Value Through a Pointer', 'WAP to read an integer, store its address in a pointer, and print its value accessed only through that pointer.', 'c', 'Pointers',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "42\n", "expected_output": "Value via pointer: 42\n"}, {"input": "7\n", "expected_output": "Value via pointer: 7\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Traverse Array Using Pointer Arithmetic', 'WAP to print all elements of an array using pointer arithmetic (not array indexing), space-separated.', 'c', 'Pointers',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n1 2 3 4 5\n", "expected_output": "1 2 3 4 5\n"}, {"input": "3\n10 20 30\n", "expected_output": "10 20 30\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Sum of Array Using Pointer Notation', 'WAP to find the sum of array elements using pointer notation instead of array indexing.', 'c', 'Pointers',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n1 2 3 4 5\n", "expected_output": "15\n"}, {"input": "4\n10 20 30 40\n", "expected_output": "100\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Print String Using Character Pointer', 'WAP to read a string and print it using only a character pointer (no array indexing, no puts()).', 'c', 'Pointers',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "hello\n", "expected_output": "hello\n"}, {"input": "Nepal\n", "expected_output": "Nepal\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Pointer to Pointer', 'WAP to read an integer and print its value accessed through a pointer to a pointer (double indirection).', 'c', 'Pointers',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "9\n", "expected_output": "Value via double pointer: 9\n"}, {"input": "3\n", "expected_output": "Value via double pointer: 3\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Dynamic Array Using malloc', 'WAP to dynamically allocate an array using malloc(), read N elements into it, and print their sum.', 'c', 'Pointers',
E'#include <stdio.h>
#include <stdlib.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "4\n1 2 3 4\n", "expected_output": "10\n"}, {"input": "3\n5 5 5\n", "expected_output": "15\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Zero-Initialized Array Using calloc', 'WAP to allocate an array of N integers using calloc() and print all elements (space-separated) to confirm they start at zero.', 'c', 'Pointers',
E'#include <stdio.h>
#include <stdlib.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "4\n", "expected_output": "0 0 0 0\n"}, {"input": "3\n", "expected_output": "0 0 0\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Reverse Array Using Pointers', 'WAP to reverse an array in place using pointers.', 'c', 'Pointers',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n1 2 3 4 5\n", "expected_output": "5 4 3 2 1\n"}, {"input": "4\n10 20 30 40\n", "expected_output": "40 30 20 10\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Double a Value via Pointer Parameter', 'WAP with a function that receives a pointer to an integer and doubles the value it points to.', 'c', 'Pointers',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "6\n", "expected_output": "12\n"}, {"input": "10\n", "expected_output": "20\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Void Pointer Demo', 'WAP to read an integer and a float, then use a single void pointer to print each value (cast appropriately at the point of use).', 'c', 'Pointers',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5 2.5\n", "expected_output": "Int via void pointer: 5\nFloat via void pointer: 2.50\n"}, {"input": "8 1.25\n", "expected_output": "Int via void pointer: 8\nFloat via void pointer: 1.25\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

-- ============================================================
-- CHAPTER: Structures and Unions
-- ============================================================

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Student Structure', 'WAP to define a structure for a Student (name, roll number, marks), read one record, and display its details.', 'c', 'Structures and Unions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "Ram 12 85\n", "expected_output": "Name: Ram\nRoll: 12\nMarks: 85\n"}, {"input": "Sita 5 92\n", "expected_output": "Name: Sita\nRoll: 5\nMarks: 92\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Array of Structures', 'WAP to store and display N students'' details (name and marks) using an array of structures, one per line in the order entered.', 'c', 'Structures and Unions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "2\nRam 85\nSita 92\n", "expected_output": "Ram 85\nSita 92\n"}, {"input": "3\nA 10\nB 20\nC 30\n", "expected_output": "A 10\nB 20\nC 30\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Nested Structure - Employee', 'WAP to define an Employee structure containing a nested Date-of-Joining structure (day, month, year), read one record (name day month year), and display it as shown.', 'c', 'Structures and Unions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "John 5 6 2020\n", "expected_output": "Name: John\nJoining Date: 5/6/2020\n"}, {"input": "Alex 1 1 2019\n", "expected_output": "Name: Alex\nJoining Date: 1/1/2019\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Pass Structure to Function', 'WAP with a Point structure (x, y) passed by value to a function that prints its members as shown.', 'c', 'Structures and Unions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3 4\n", "expected_output": "x = 3, y = 4\n"}, {"input": "10 -5\n", "expected_output": "x = 10, y = -5\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Pass Structure Pointer to Function', 'WAP with a Point structure (x, y) passed by pointer to a function that doubles both coordinates, then print the updated values as shown.', 'c', 'Structures and Unions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3 4\n", "expected_output": "x = 6, y = 8\n"}, {"input": "5 5\n", "expected_output": "x = 10, y = 10\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Union Size Demo', 'WAP to declare a union with an int member and a float member, then print the size of the union to confirm it equals the size of its largest member.', 'c', 'Structures and Unions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "Union size: 4\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Compare Two Structures', 'WAP with a Point structure (x, y) to read two points and print "Equal" if both coordinates match, otherwise "Not Equal".', 'c', 'Structures and Unions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3 4\n3 4\n", "expected_output": "Equal\n"}, {"input": "1 2\n1 3\n", "expected_output": "Not Equal\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Book With Maximum Price', 'WAP using an array of structures to store N book records (title, price) and print the title of the book with the maximum price.', 'c', 'Structures and Unions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3\nBookA 100\nBookB 250\nBookC 180\n", "expected_output": "BookB\n"}, {"input": "2\nX 50\nY 75\n", "expected_output": "Y\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Structure Initialization and Update', 'WAP with a Point structure (x, y), initialize it from input, print it, then add 5 to x and print the updated structure as shown.', 'c', 'Structures and Unions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5 10\n", "expected_output": "Initial: 5 10\nUpdated: 10 10\n"}, {"input": "2 3\n", "expected_output": "Initial: 2 3\nUpdated: 7 3\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Structure vs Union Size', 'WAP to declare a structure and a union, each with the same members (int, char, float), and print the size of both to compare padding behavior.', 'c', 'Structures and Unions',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "Struct size: 12\nUnion size: 4\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

-- ============================================================
-- CHAPTER: File Handling in C
-- ============================================================

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Product of Two Numbers to File', 'WAP to read two integers from "data.txt", compute their product, and write the result to "result.txt".', 'c', 'File Handling in C',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "", "input_files": {"data.txt": "5 3"}, "expected_files": {"result.txt": "15\n"}}, {"input": "", "expected_output": "", "input_files": {"data.txt": "10 20"}, "expected_files": {"result.txt": "200\n"}}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Sum of Numbers From File', 'WAP to read a list of numbers from "numbers.txt" and write their sum to "sum.txt".', 'c', 'File Handling in C',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "", "input_files": {"numbers.txt": "1 2 3 4 5"}, "expected_files": {"sum.txt": "15\n"}}, {"input": "", "expected_output": "", "input_files": {"numbers.txt": "10 20 30"}, "expected_files": {"sum.txt": "60\n"}}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Word Count From File', 'WAP to count the number of words in "input.txt" and write the count to "output.txt".', 'c', 'File Handling in C',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "", "input_files": {"input.txt": "hello world csit"}, "expected_files": {"output.txt": "3\n"}}, {"input": "", "expected_output": "", "input_files": {"input.txt": "one two three four"}, "expected_files": {"output.txt": "4\n"}}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Reverse Word Order From File', 'WAP to read a sentence from "input.txt" and write its words in reverse order to "output.txt".', 'c', 'File Handling in C',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "", "input_files": {"input.txt": "hello world"}, "expected_files": {"output.txt": "world hello\n"}}, {"input": "", "expected_output": "", "input_files": {"input.txt": "csit is fun"}, "expected_files": {"output.txt": "fun is csit\n"}}]',
2, 64, 20, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Copy File Contents', 'WAP to copy the contents of "source.txt" to "destination.txt" using file handling.', 'c', 'File Handling in C',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "", "input_files": {"source.txt": "Nepal Rocks"}, "expected_files": {"destination.txt": "Nepal Rocks"}}, {"input": "", "expected_output": "", "input_files": {"source.txt": "Hello"}, "expected_files": {"destination.txt": "Hello"}}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Filter Passing Students From File', 'WAP to read student records ("Name Marks" per line) from "students.txt" and write only passing students (marks >= 40) to "pass.txt", preserving order.', 'c', 'File Handling in C',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "", "input_files": {"students.txt": "Ram 45\nSita 30\nHari 60\n"}, "expected_files": {"pass.txt": "Ram 45\nHari 60\n"}}, {"input": "", "expected_output": "", "input_files": {"students.txt": "A 39\nB 40\nC 100\n"}, "expected_files": {"pass.txt": "B 40\nC 100\n"}}]',
2, 64, 20, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Count Vowels From File', 'WAP to count the number of vowels in "input.txt" and write the count to "output.txt".', 'c', 'File Handling in C',
E'#include <stdio.h>
#include <ctype.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "", "input_files": {"input.txt": "hello world"}, "expected_files": {"output.txt": "3\n"}}, {"input": "", "expected_output": "", "input_files": {"input.txt": "csit programming"}, "expected_files": {"output.txt": "4\n"}}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Maximum Value From File', 'WAP to read integers from "data.txt" and write the maximum value to "result.txt".', 'c', 'File Handling in C',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "", "input_files": {"data.txt": "5 9 2 7"}, "expected_files": {"result.txt": "9\n"}}, {"input": "", "expected_output": "", "input_files": {"data.txt": "10 3 8"}, "expected_files": {"result.txt": "10\n"}}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Append Line and Count Lines', 'WAP to append the line "New Entry" to the existing file "log.txt", then write the total number of lines in "log.txt" to "count.txt".', 'c', 'File Handling in C',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "", "input_files": {"log.txt": "line1\nline2\n"}, "expected_files": {"log.txt": "line1\nline2\nNew Entry\n", "count.txt": "3\n"}}, {"input": "", "expected_output": "", "input_files": {"log.txt": "start\n"}, "expected_files": {"log.txt": "start\nNew Entry\n", "count.txt": "2\n"}}]',
2, 64, 20, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Convert File Content to Uppercase', 'WAP to read the content of "input.txt" and write the same content converted to uppercase into "output.txt".', 'c', 'File Handling in C',
E'#include <stdio.h>
#include <ctype.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "", "input_files": {"input.txt": "hello world"}, "expected_files": {"output.txt": "HELLO WORLD\n"}}, {"input": "", "expected_output": "", "input_files": {"input.txt": "csit fun"}, "expected_files": {"output.txt": "CSIT FUN\n"}}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

-- ============================================================
-- NOTE ON CHAPTER 9 — Introduction to Graphics
-- ============================================================
--
--
-- graphics.h itself can't run in this platform's headless Docker
-- judge, so these 10 questions simulate the same core ideas
-- (lines, shapes, fill, color codes, init, bar charts) using plain
-- stdout/ASCII output — fully auto-gradable with the existing
-- stdout-based test-case format, no judge changes required.

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Draw a Horizontal Line', 'WAP to simulate line() by printing a horizontal line of asterisks of a given length.', 'c', 'Introduction to Graphics',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n", "expected_output": "*****\n"}, {"input": "8\n", "expected_output": "********\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Draw a Vertical Line', 'WAP to simulate line() by printing a vertical line of asterisks (one per row) of a given height.', 'c', 'Introduction to Graphics',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3\n", "expected_output": "*\n*\n*\n"}, {"input": "4\n", "expected_output": "*\n*\n*\n*\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Draw a Rectangle Outline', 'WAP to simulate rectangle() by drawing a hollow rectangle outline of given width and height using asterisks (interior filled with spaces).', 'c', 'Introduction to Graphics',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "4 3\n", "expected_output": "****\n*  *\n****\n"}, {"input": "5 4\n", "expected_output": "*****\n*   *\n*   *\n*****\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Draw a Filled Rectangle', 'WAP to simulate a filled rectangle (like bar() in graphics.h) of given width and height, entirely filled with asterisks.', 'c', 'Introduction to Graphics',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3 2\n", "expected_output": "***\n***\n"}, {"input": "4 3\n", "expected_output": "****\n****\n****\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Draw a Right Triangle', 'WAP to simulate a drawn shape by printing a right-angled triangle pattern of asterisks with the given height.', 'c', 'Introduction to Graphics',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "4\n", "expected_output": "*\n**\n***\n****\n"}, {"input": "3\n", "expected_output": "*\n**\n***\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Draw a Diamond Pattern', 'WAP to simulate a composite shape by printing a diamond pattern of asterisks, given n as the number of rows in its upper half.', 'c', 'Introduction to Graphics',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3\n", "expected_output": "  *\n ***\n*****\n ***\n  *\n"}, {"input": "2\n", "expected_output": " *\n***\n *\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Color Code to Name', 'WAP to simulate setcolor() by reading a graphics.h color code (0-15) and printing the matching standard color name (0=BLACK ... 15=WHITE).', 'c', 'Introduction to Graphics',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "4\n", "expected_output": "RED\n"}, {"input": "14\n", "expected_output": "YELLOW\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Simulate Graphics Initialization', 'WAP to simulate initgraph() by reading a driver code and mode code, then printing an initialization confirmation message in the exact format shown.', 'c', 'Introduction to Graphics',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "0 0\n", "expected_output": "Graphics initialized: driver=0, mode=0\n"}, {"input": "9 1\n", "expected_output": "Graphics initialized: driver=9, mode=1\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Draw a Bar Chart', 'WAP to simulate drawing a simple bar chart: read N values and print one line per value containing that many asterisks.', 'c', 'Introduction to Graphics',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3\n2 4 1\n", "expected_output": "**\n****\n*\n"}, {"input": "2\n5 3\n", "expected_output": "*****\n***\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Draw an X Pattern', 'WAP to simulate two crossing lines (as line() would draw diagonally) by printing an n x n grid with asterisks on both diagonals and spaces elsewhere.', 'c', 'Introduction to Graphics',
E'#include <stdio.h>

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n", "expected_output": "*   *\n * * \n  *  \n * * \n*   *\n"}, {"input": "3\n", "expected_output": "* *\n * \n* *\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher.sem1'), 'assignment');