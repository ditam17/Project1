-- ============================================================
-- C++ PROGRAMMING QUESTIONS — Chapters 1 through 7
-- CSIT 202 (Object-Oriented Programming in C++), Semester II
-- 10 questions per chapter, 70 total. No chapter skipped —
-- unlike C, Unit 1 here is genuine OOP-intro content.
--
-- created_by resolves to the Semester II teacher (Sushant Sir)
-- by login_id, not a hardcoded numeric id.
-- Run this AFTER add_chapter_column.sql has been applied.
-- ============================================================

-- ============================================================
-- CHAPTER: Introduction to C++ and OOP
-- ============================================================

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Basic Input and Output', 'WAP to read two numbers using cin and print their sum using cout.', 'cpp', 'Introduction to C++ and OOP',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3 4\n", "expected_output": "7\n"}, {"input": "10 20\n", "expected_output": "30\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Greeting Message', 'WAP to read a name and an age using cin, then print a greeting message using cout in the exact format shown.', 'cpp', 'Introduction to C++ and OOP',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "Ram 20\n", "expected_output": "Hello Ram, you are 20 years old.\n"}, {"input": "Sita 22\n", "expected_output": "Hello Sita, you are 22 years old.\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Formatted Float Output', 'WAP to read a floating point number and print it using cout formatted to exactly two decimal places.', 'cpp', 'Introduction to C++ and OOP',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3.14159\n", "expected_output": "3.14\n"}, {"input": "2.71828\n", "expected_output": "2.72\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Rectangle Class Area', 'WAP to create a class Rectangle with length and breadth as public data members and a member function to compute and print its area.', 'cpp', 'Introduction to C++ and OOP',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5 4\n", "expected_output": "Area: 20\n"}, {"input": "3 6\n", "expected_output": "Area: 18\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Two Rectangle Objects', 'WAP to create two objects of a Rectangle class with different dimensions and print both of their areas as shown.', 'cpp', 'Introduction to C++ and OOP',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5 4\n3 6\n", "expected_output": "Area1: 20\nArea2: 18\n"}, {"input": "2 2\n4 5\n", "expected_output": "Area1: 4\nArea2: 20\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Encapsulation with Getter and Setter', 'WAP to demonstrate encapsulation by creating a class with a private balance attribute, a public setter to set it, and a public getter that prints it in the exact format shown.', 'cpp', 'Introduction to C++ and OOP',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "100\n", "expected_output": "Balance: 100\n"}, {"input": "250\n", "expected_output": "Balance: 250\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Abstraction with a Circle Class', 'WAP to demonstrate abstraction by creating a Circle class that hides the area formula behind a public method, using pi = 3.14 and printing the area to two decimal places.', 'cpp', 'Introduction to C++ and OOP',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n", "expected_output": "Area: 78.50\n"}, {"input": "2\n", "expected_output": "Area: 12.56\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Namespaces Demo', 'WAP to define the same function name display() inside two different namespaces, A and B, then call both, printing "Namespace A: Hello from A" and "Namespace B: Hello from B" on separate lines.', 'cpp', 'Introduction to C++ and OOP',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "Namespace A: Hello from A\nNamespace B: Hello from B\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Scope Resolution Operator', 'WAP to declare a class Calculator with an add(int, int) member function declared inside the class but defined outside it using the scope resolution operator, then print the result.', 'cpp', 'Introduction to C++ and OOP',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3 5\n", "expected_output": "8\n"}, {"input": "10 1\n", "expected_output": "11\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Average of Three Numbers', 'WAP to read three numbers and print their average formatted to two decimal places.', 'cpp', 'Introduction to C++ and OOP',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3 4 5\n", "expected_output": "4.00\n"}, {"input": "10 20 30\n", "expected_output": "20.00\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

-- ============================================================
-- CHAPTER: Classes and Objects
-- ============================================================

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Default Constructor', 'WAP to create a class Point with a default constructor that initializes x and y to 0, then print both values in the format shown.', 'cpp', 'Classes and Objects',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "x = 0, y = 0\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Parameterized Constructor', 'WAP to create a class Point with a parameterized constructor that initializes x and y from input, then print both values in the format shown.', 'cpp', 'Classes and Objects',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3 4\n", "expected_output": "x = 3, y = 4\n"}, {"input": "10 -5\n", "expected_output": "x = 10, y = -5\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Constructor Overloading', 'WAP to create a class Box with a default constructor (side = 1) and a parameterized constructor (length, width, height). Read a flag (0 for default, 1 for parameterized, followed by the three dimensions if 1), then print the volume as "Volume: X".', 'cpp', 'Classes and Objects',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "0\n", "expected_output": "Volume: 1\n"}, {"input": "1\n3 4 5\n", "expected_output": "Volume: 60\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Copy Constructor', 'WAP to create a class Point, read x and y, create one object, then create a second object using the copy constructor from the first, and print both in the format shown.', 'cpp', 'Classes and Objects',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5 10\n", "expected_output": "Original: 5 10\nCopy: 5 10\n"}, {"input": "1 2\n", "expected_output": "Original: 1 2\nCopy: 1 2\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('The this Pointer', 'WAP to create a class Point with a parameterized constructor whose parameters are named x and y, the same as the data members, and use the this pointer to resolve the naming conflict correctly.', 'cpp', 'Classes and Objects',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "7 9\n", "expected_output": "x = 7, y = 9\n"}, {"input": "2 3\n", "expected_output": "x = 2, y = 3\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Static Data Member', 'WAP to create a class Counter with a static data member tracking how many objects have been created. Read n, create n objects, and print the total count in the format shown.', 'cpp', 'Classes and Objects',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3\n", "expected_output": "Objects created: 3\n"}, {"input": "5\n", "expected_output": "Objects created: 5\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Static Member Function', 'WAP to create a class Item with a static data member tracking the object count and a static member function that returns the count without needing an object. Read n, create n objects, then call the static function and print the total.', 'cpp', 'Classes and Objects',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "4\n", "expected_output": "Total objects: 4\n"}, {"input": "2\n", "expected_output": "Total objects: 2\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Constructor and Destructor Messages', 'WAP to create a class Demo whose constructor prints "Constructed" and whose destructor prints "Destructed". Declare two objects one after another in main and observe the order in which they are constructed and destructed.', 'cpp', 'Classes and Objects',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "Constructed\nConstructed\nDestructed\nDestructed\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Private Method Called Internally', 'WAP to create a class Calculator with a private member function square() and a public member function getSquare() that calls the private function internally, then print the result.', 'cpp', 'Classes and Objects',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n", "expected_output": "25\n"}, {"input": "6\n", "expected_output": "36\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Array of Objects', 'WAP to create an array of objects of a class Employee (name, salary), read N records, and print each salary on its own line in the order entered.', 'cpp', 'Classes and Objects',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3\nRam 50000\nSita 60000\nHari 45000\n", "expected_output": "50000\n60000\n45000\n"}, {"input": "2\nA 1000\nB 2000\n", "expected_output": "1000\n2000\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

-- ============================================================
-- CHAPTER: Operator Overloading and Type Conversion
-- ============================================================

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Overload + for Complex Numbers', 'WAP to create a class Complex (real, imag) and overload the + operator to add two Complex objects, printing the result as "Sum: R + Ii".', 'cpp', 'Operator Overloading and Type Conversion',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3 4\n1 2\n", "expected_output": "Sum: 4 + 6i\n"}, {"input": "5 -3\n2 3\n", "expected_output": "Sum: 7 + 0i\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Overload Unary Minus', 'WAP to create a class Point (x, y) and overload the unary minus operator to negate both coordinates, printing the result space separated.', 'cpp', 'Operator Overloading and Type Conversion',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3 4\n", "expected_output": "-3 -4\n"}, {"input": "-5 2\n", "expected_output": "5 -2\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Overload == for Points', 'WAP to create a class Point (x, y) and overload the == operator to compare two Point objects, printing "Equal" or "Not Equal".', 'cpp', 'Operator Overloading and Type Conversion',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3 4\n3 4\n", "expected_output": "Equal\n"}, {"input": "1 2\n1 3\n", "expected_output": "Not Equal\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Overload << Using a Friend Function', 'WAP to create a class Complex (real, imag) and overload the << operator using a friend function so a Complex object can be printed directly with cout in the format "R + Ii".', 'cpp', 'Operator Overloading and Type Conversion',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3 4\n", "expected_output": "3 + 4i\n"}, {"input": "5 2\n", "expected_output": "5 + 2i\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Friend Function Operator Overload', 'WAP to create a class Distance (feet, inches) and overload the + operator using a friend function to add two Distance objects without normalizing inches, printing the result in the format shown.', 'cpp', 'Operator Overloading and Type Conversion',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5 6\n3 8\n", "expected_output": "Feet: 8, Inches: 14\n"}, {"input": "2 10\n1 5\n", "expected_output": "Feet: 3, Inches: 15\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Basic-to-Class Type Conversion', 'WAP to create a class Complex with a constructor that converts a single int into a Complex number (imag = 0), then add it to another Complex object and print the result as "Sum: R + Ii".', 'cpp', 'Operator Overloading and Type Conversion',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n3 4\n", "expected_output": "Sum: 8 + 4i\n"}, {"input": "2\n1 1\n", "expected_output": "Sum: 3 + 1i\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Class-to-Basic Type Conversion', 'WAP to create a class Fraction (numerator, denominator) and overload the conversion operator to convert it into a double, then print the value formatted to two decimal places.', 'cpp', 'Operator Overloading and Type Conversion',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "1 2\n", "expected_output": "0.50\n"}, {"input": "3 4\n", "expected_output": "0.75\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Overload Pre-Increment', 'WAP to create a class Counter with an integer value and overload the pre-increment (++) operator, then print the value after applying it once.', 'cpp', 'Operator Overloading and Type Conversion',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n", "expected_output": "6\n"}, {"input": "10\n", "expected_output": "11\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Overload Scalar Multiplication', 'WAP to create a class Point (x, y) and overload the * operator so a Point can be multiplied by an integer scalar, printing the result space separated.', 'cpp', 'Operator Overloading and Type Conversion',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3 4\n2\n", "expected_output": "6 8\n"}, {"input": "5 -1\n3\n", "expected_output": "15 -3\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Overload > to Compare Boxes', 'WAP to create a class Box (length, width, height) and overload the > operator to compare two Box objects by volume, printing "Box1 is greater" or "Box2 is greater".', 'cpp', 'Operator Overloading and Type Conversion',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "2 3 4\n1 1 1\n", "expected_output": "Box1 is greater\n"}, {"input": "1 1 1\n2 2 2\n", "expected_output": "Box2 is greater\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

-- ============================================================
-- CHAPTER: Inheritance
-- ============================================================

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Single Inheritance Demo', 'WAP to demonstrate single inheritance using a base class Person and a derived class Student, printing the name and age in the format shown.', 'cpp', 'Inheritance',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "Ram 20\n", "expected_output": "Name: Ram\nAge: 20\n"}, {"input": "Sita 22\n", "expected_output": "Name: Sita\nAge: 22\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Multilevel Inheritance', 'WAP to demonstrate multilevel inheritance using Animal, Mammal (derived from Animal), and Dog (derived from Mammal). Print the fixed messages "Animal can eat.", "Mammal can walk.", "Dog can bark." followed by the name read from input.', 'cpp', 'Inheritance',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "Tommy\n", "expected_output": "Animal can eat.\nMammal can walk.\nDog can bark.\nName: Tommy\n"}, {"input": "Rex\n", "expected_output": "Animal can eat.\nMammal can walk.\nDog can bark.\nName: Rex\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Multiple Inheritance', 'WAP to demonstrate multiple inheritance using a class Result derived from both Test (test marks) and Sports (sports marks), printing the combined total.', 'cpp', 'Inheritance',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "80 90\n", "expected_output": "Total: 170\n"}, {"input": "70 65\n", "expected_output": "Total: 135\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Hierarchical Inheritance', 'WAP to demonstrate hierarchical inheritance using a base class Shape with derived classes Circle and Square, each computing its own area. Read a shape name and its dimension(s), then print the area formatted to two decimal places (use pi = 3.14 for Circle).', 'cpp', 'Inheritance',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "circle 5\n", "expected_output": "Area: 78.50\n"}, {"input": "square 4\n", "expected_output": "Area: 16.00\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Constructor and Destructor Order in Inheritance', 'WAP to create a base class Base and a derived class Derived, each printing a message from its constructor and destructor. Create one Derived object in main and observe that Base constructs first, then Derived, and they destruct in the opposite order.', 'cpp', 'Inheritance',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "Base Constructor\nDerived Constructor\nDerived Destructor\nBase Destructor\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Virtual Base Class', 'WAP to demonstrate the diamond problem using a base class A (with a data member x), classes B and C that both virtually inherit from A, and a class D that inherits from both B and C. Set x through D and print it to confirm only one copy of x exists.', 'cpp', 'Inheritance',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n", "expected_output": "x = 5\n"}, {"input": "10\n", "expected_output": "x = 10\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Object Slicing', 'WAP to demonstrate object slicing: create a base class Animal and a derived class Dog, each with a non-virtual speak() function. Assign a Dog object to an Animal-typed variable and call speak() on it, observing that only the Animal version runs.', 'cpp', 'Inheritance',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "Animal sound\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Protected Access Specifier', 'WAP to create a base class Account with a protected balance member and a derived class SavingsAccount that directly accesses and updates the protected balance in a deposit function, then print the new balance.', 'cpp', 'Inheritance',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "1000 500\n", "expected_output": "Balance: 1500\n"}, {"input": "2000 250\n", "expected_output": "Balance: 2250\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Function Overriding Basics', 'WAP to create a base class Shape with an area() function and a derived class Circle that overrides it to compute the actual area (use pi = 3.14), calling it directly through a Circle object and printing the result to two decimal places.', 'cpp', 'Inheritance',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n", "expected_output": "Area: 78.50\n"}, {"input": "3\n", "expected_output": "Area: 28.26\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Constructors With Parameters in Multilevel Inheritance', 'WAP to create classes A, B (derived from A), and C (derived from B), where each level takes its own constructor parameter and prints it. Read three values and print each level''s value in the format shown.', 'cpp', 'Inheritance',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5 10 15\n", "expected_output": "A: 5\nB: 10\nC: 15\n"}, {"input": "1 2 3\n", "expected_output": "A: 1\nB: 2\nC: 3\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

-- ============================================================
-- CHAPTER: Polymorphism and Virtual Functions
-- ============================================================

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Function Overloading by Type', 'WAP to overload a function add() to work with two ints and with two doubles. Read a type flag (i or d) followed by two values, call the matching overload, and print the result (integers plain, doubles to two decimal places).', 'cpp', 'Polymorphism and Virtual Functions',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "i 3 4\n", "expected_output": "7\n"}, {"input": "d 2.5 3.5\n", "expected_output": "6.00\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Function Overloading by Parameter Count', 'WAP to overload a function sum() to accept either two or three integers. Read a count followed by that many numbers, call the matching overload, and print the result as "Sum: X".', 'cpp', 'Polymorphism and Virtual Functions',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "2\n3 4\n", "expected_output": "Sum: 7\n"}, {"input": "3\n3 4 5\n", "expected_output": "Sum: 12\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Early Binding Without Virtual', 'WAP to create a base class Base and a derived class Derived, both with a non-virtual show() function. Use a Base pointer to point to a Derived object and call show(), observing that the Base version runs (early binding).', 'cpp', 'Polymorphism and Virtual Functions',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "Base show\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Runtime Polymorphism With Virtual Functions', 'WAP to create a base class Base and a derived class Derived, both with a virtual show() function. Use a Base pointer to point to a Derived object and call show(), observing that the Derived version runs (late binding).', 'cpp', 'Polymorphism and Virtual Functions',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "Derived show\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Polymorphism Using References', 'WAP to create a base class Shape with a virtual area() function and derived classes Circle and Square. Read a shape name and dimension, call area() through a base class reference, and print the result to two decimal places (use pi = 3.14).', 'cpp', 'Polymorphism and Virtual Functions',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "circle 5\n", "expected_output": "Area: 78.50\n"}, {"input": "square 4\n", "expected_output": "Area: 16.00\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Pure Virtual Function and Abstract Class', 'WAP to create an abstract class Shape with a pure virtual area() function, and derived classes Circle and Rectangle that implement it. Read the shape type and dimensions, then print the computed area to two decimal places (use pi = 3.14).', 'cpp', 'Polymorphism and Virtual Functions',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "circle 5\n", "expected_output": "Area: 78.50\n"}, {"input": "rectangle 4 5\n", "expected_output": "Area: 20.00\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Array of Base Class Pointers', 'WAP to create an abstract class Shape with a pure virtual area() function and derived classes Circle and Square. Read N shapes (name and dimension each), store them in an array of Shape pointers, then loop through and print each area to two decimal places (use pi = 3.14).', 'cpp', 'Polymorphism and Virtual Functions',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "2\ncircle 5\nsquare 4\n", "expected_output": "Area: 78.50\nArea: 16.00\n"}, {"input": "2\nsquare 2\ncircle 3\n", "expected_output": "Area: 4.00\nArea: 28.26\n"}]',
2, 64, 20, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Virtual Destructor Pattern', 'WAP to create a base class Base and a derived class Derived, both with a virtual destructor that prints a message. Create a Derived object via a Base pointer using new, then delete it through the Base pointer, and observe that both destructors run in the correct order.', 'cpp', 'Polymorphism and Virtual Functions',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "Derived Destructor\nBase Destructor\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Abstract Class Cannot Be Instantiated', 'WAP to create an abstract class Shape with a pure virtual area() function and a derived class Circle that implements it. Show that Shape can only be used via a pointer to a derived object (Shape* s = new Circle(...)), then print the area to two decimal places (use pi = 3.14).', 'cpp', 'Polymorphism and Virtual Functions',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n", "expected_output": "Area: 78.50\n"}, {"input": "3\n", "expected_output": "Area: 28.26\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Overloaded print Function', 'WAP to overload a function print() to accept either an int or a string. Read an integer on one line and a word on the next, call both overloads, and print the results in the format shown.', 'cpp', 'Polymorphism and Virtual Functions',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\nhello\n", "expected_output": "Int: 5\nString: hello\n"}, {"input": "10\nworld\n", "expected_output": "Int: 10\nString: world\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

-- ============================================================
-- CHAPTER: Templates and Exception Handling
-- ============================================================

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Function Template for Maximum', 'WAP to write a function template that returns the maximum of two values of any type. Read a type flag (int or double) followed by two values, and print the maximum (doubles to two decimal places).', 'cpp', 'Templates and Exception Handling',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "int 3 7\n", "expected_output": "7\n"}, {"input": "double 2.5 1.5\n", "expected_output": "2.50\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Function Template for Swap', 'WAP to write a function template that swaps two integer values, then print them in swapped order.', 'cpp', 'Templates and Exception Handling',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3 8\n", "expected_output": "8 3\n"}, {"input": "1 2\n", "expected_output": "2 1\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Class Template for a Pair', 'WAP to write a class template Pair that stores two values of the same type and prints them in the format "First: A, Second: B".', 'cpp', 'Templates and Exception Handling',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "3 4\n", "expected_output": "First: 3, Second: 4\n"}, {"input": "10 20\n", "expected_output": "First: 10, Second: 20\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Function Template for Array Sum', 'WAP to write a function template that computes the sum of an array of integers, reading N followed by N values.', 'cpp', 'Templates and Exception Handling',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n1 2 3 4 5\n", "expected_output": "15\n"}, {"input": "3\n10 20 30\n", "expected_output": "60\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Divide by Zero Exception', 'WAP to read two integers and divide the first by the second, using try, throw, and catch to handle division by zero by printing "Error: Division by zero" instead of crashing.', 'cpp', 'Templates and Exception Handling',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "10 0\n", "expected_output": "Error: Division by zero\n"}, {"input": "10 2\n", "expected_output": "5\n"}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Multiple Catch Blocks', 'WAP to read a flag (1 or 2); if 1, throw an int and catch it printing "Caught int exception"; if 2, throw a string and catch it printing "Caught string exception". Use separate catch blocks for each type.', 'cpp', 'Templates and Exception Handling',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "1\n", "expected_output": "Caught int exception\n"}, {"input": "2\n", "expected_output": "Caught string exception\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Nested Try-Catch With Rethrow', 'WAP to demonstrate a nested try-catch where an inner try block catches an exception, rethrows it, and an outer catch block catches it again, printing "Caught in outer: Rethrown error".', 'cpp', 'Templates and Exception Handling',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "Caught in outer: Rethrown error\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Custom Exception Class', 'WAP to create a custom exception class derived from std::exception with an overridden what() method. Read a number; if it is negative, throw the custom exception with the message "Negative value not allowed" and catch it, printing "Caught: " followed by the message; otherwise print "Valid: " followed by the number.', 'cpp', 'Templates and Exception Handling',
E'#include <iostream>
#include <exception>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "-5\n", "expected_output": "Caught: Negative value not allowed\n"}, {"input": "5\n", "expected_output": "Valid: 5\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Array Index Out of Range Exception', 'WAP to read an array and an index to access, throwing and catching an exception with the message "Error: Index out of range" if the index is invalid; otherwise print the element at that index.', 'cpp', 'Templates and Exception Handling',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n3 7 2 9 4\n10\n", "expected_output": "Error: Index out of range\n"}, {"input": "5\n3 7 2 9 4\n2\n", "expected_output": "7\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Validate Negative Input', 'WAP to write a function that computes the integer square root of a perfect square, throwing and catching an exception with the message "Error: Negative input not allowed" if the input is negative; otherwise print "Result: " followed by the square root.', 'cpp', 'Templates and Exception Handling',
E'#include <iostream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "16\n", "expected_output": "Result: 4\n"}, {"input": "-4\n", "expected_output": "Error: Negative input not allowed\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

-- ============================================================
-- CHAPTER: File Handling in C++
-- ============================================================

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Write and Read Back a File', 'WAP to read a line of text, write it to "output.txt" using ofstream, then read it back using ifstream and print it to the console.', 'cpp', 'File Handling in C++',
E'#include <iostream>
#include <fstream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "Hello, File!\n", "expected_output": "Hello, File!\n", "expected_files": {"output.txt": "Hello, File!\n"}}, {"input": "CSIT Rocks\n", "expected_output": "CSIT Rocks\n", "expected_files": {"output.txt": "CSIT Rocks\n"}}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Sum Two Numbers From File', 'WAP to read two integers from "data.txt" using ifstream and write their sum to "result.txt" using ofstream.', 'cpp', 'File Handling in C++',
E'#include <iostream>
#include <fstream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "", "input_files": {"data.txt": "5 3"}, "expected_files": {"result.txt": "8\n"}}, {"input": "", "expected_output": "", "input_files": {"data.txt": "10 20"}, "expected_files": {"result.txt": "30\n"}}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Append to a File', 'WAP to append the line "New Entry" to the existing file "log.txt" using ofstream in append mode, then read and print the entire updated file content to the console.', 'cpp', 'File Handling in C++',
E'#include <iostream>
#include <fstream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "line1\nline2\nNew Entry\n", "input_files": {"log.txt": "line1\nline2\n"}, "expected_files": {"log.txt": "line1\nline2\nNew Entry\n"}}, {"input": "", "expected_output": "start\nNew Entry\n", "input_files": {"log.txt": "start\n"}, "expected_files": {"log.txt": "start\nNew Entry\n"}}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Count Lines in a File', 'WAP to count the number of lines in "input.txt" using ifstream and print the count.', 'cpp', 'File Handling in C++',
E'#include <iostream>
#include <fstream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "3\n", "input_files": {"input.txt": "a\nb\nc\n"}}, {"input": "", "expected_output": "2\n", "input_files": {"input.txt": "x\ny\n"}}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Copy File Contents', 'WAP to copy the contents of "source.txt" to "destination.txt" using fstream.', 'cpp', 'File Handling in C++',
E'#include <iostream>
#include <fstream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "", "input_files": {"source.txt": "Nepal Rocks"}, "expected_files": {"destination.txt": "Nepal Rocks"}}, {"input": "", "expected_output": "", "input_files": {"source.txt": "Hello"}, "expected_files": {"destination.txt": "Hello"}}]',
2, 64, 10, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Binary File Write and Read', 'WAP to read N integers, write them to a binary file using ofstream in binary mode, then read them back using ifstream in binary mode and print them space separated.', 'cpp', 'File Handling in C++',
E'#include <iostream>
#include <fstream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "4\n1 2 3 4\n", "expected_output": "1 2 3 4\n"}, {"input": "3\n10 20 30\n", "expected_output": "10 20 30\n"}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('File Size Using tellg', 'WAP to use tellg() to print the size (in bytes) of "input.txt".', 'cpp', 'File Handling in C++',
E'#include <iostream>
#include <fstream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "5\n", "input_files": {"input.txt": "Hello"}}, {"input": "", "expected_output": "8\n", "input_files": {"input.txt": "Hi there"}}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Read First N Characters Using seekg', 'WAP to use seekg() to position at the start of "input.txt" and print only the first N characters, where N is read from input.', 'cpp', 'File Handling in C++',
E'#include <iostream>
#include <fstream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "5\n", "expected_output": "Hello\n", "input_files": {"input.txt": "Hello World"}}, {"input": "4\n", "expected_output": "Prog\n", "input_files": {"input.txt": "Programming"}}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Filter Failing Students From File', 'WAP to read student records ("Name Marks" per line) from "students.txt" and write only failing students (marks less than 40) to "fail.txt", preserving order.', 'cpp', 'File Handling in C++',
E'#include <iostream>
#include <fstream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "", "expected_output": "", "input_files": {"students.txt": "Ram 45\nSita 30\nHari 60\n"}, "expected_files": {"fail.txt": "Sita 30\n"}}, {"input": "", "expected_output": "", "input_files": {"students.txt": "A 39\nB 40\nC 10\n"}, "expected_files": {"fail.txt": "A 39\nC 10\n"}}]',
2, 64, 20, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');

INSERT INTO questions (title, description, language, chapter, starter_code, test_cases, time_limit, memory_limit, points, created_by, category) VALUES
('Overwrite a Character Using seekp', 'WAP to use seekp() to move to a given character position in "input.txt" and overwrite it with a given character (read as position then character), then confirm the change is reflected in the file.', 'cpp', 'File Handling in C++',
E'#include <iostream>
#include <fstream>
using namespace std;

int main() {
    // Write your code here
    return 0;
}',
'[{"input": "0 J\n", "expected_output": "", "input_files": {"input.txt": "Hello World"}, "expected_files": {"input.txt": "Jello World"}}, {"input": "6 w\n", "expected_output": "", "input_files": {"input.txt": "Hello World"}, "expected_files": {"input.txt": "Hello world"}}]',
2, 64, 15, (SELECT id FROM users WHERE login_id = 'teacher1'), 'assignment');