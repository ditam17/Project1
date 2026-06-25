import React, { useState, useEffect, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import api from "../../services/api";

const StudentPortal = () => {
  const [language, setLanguage] = useState("c");
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [plagiarismMatches, setPlagiarismMatches] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [progress, setProgress] = useState({
    solved_count: 0,
    total_score: 0,
    total_questions: 0,
  });
  const [terminalReady, setTerminalReady] = useState(false);

  const terminalRef = useRef(null);
  const terminalInstance = useRef(null);
  const fitAddon = useRef(null);
  const socketRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // Initialize xterm.js terminal with proper sizing - using requestAnimationFrame
  useEffect(() => {
    let term = null;
    let rafId = null;

    const initTerminal = () => {
      const container = terminalRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        rafId = requestAnimationFrame(initTerminal);
        return;
      }

      // Clean up any existing terminal
      if (terminalInstance.current) {
        terminalInstance.current.dispose();
        terminalInstance.current = null;
      }

      term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: "#1e1e1e",
          foreground: "#d4d4d4",
          cursor: "#d4d4d4",
          selectionBackground: "#264f78",
          black: "#000000",
          red: "#cd3131",
          green: "#0dbc79",
          yellow: "#e5e510",
          blue: "#2472c8",
          magenta: "#bc3fbc",
          cyan: "#11a8cd",
          white: "#e5e5e5",
        },
        scrollback: 1000,
        rows: 12,
        cols: 80,
        convertEol: true,
      });

      fitAddon.current = new FitAddon();
      term.loadAddon(fitAddon.current);
      term.open(container);

      // Defer fit to next frame to avoid ResizeObserver loop error
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            fitAddon.current.fit();
          } catch (e) {
            console.warn("Initial fit failed:", e);
          }
        });
      });

      term.writeln("[32m● Interactive Terminal Ready[0m");
      term.writeln("Click '▶️ Run Code' to start your program.");
      term.writeln("Type input directly when the program asks for it.");
      term.writeln("");

      // Handle user typing in terminal - send to running program
      term.onData((data) => {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit("input", { input: data });
        }
      });

      terminalInstance.current = term;
      setTerminalReady(true);
    };

    // Use requestAnimationFrame instead of setTimeout for better timing
    rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(initTerminal);
    });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (term) {
        term.dispose();
      }
      if (terminalInstance.current) {
        terminalInstance.current.dispose();
        terminalInstance.current = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch questions on language change
  useEffect(() => {
    fetchQuestions();
    fetchProgress();
  }, [language]);

  useEffect(() => {
    if (selectedQuestion) {
      fetchSubmissions(selectedQuestion.id);
      fetchPlagiarism(selectedQuestion.id);
    }
  }, [selectedQuestion]);

  const fetchQuestions = async () => {
    try {
      const res = await api.get(`/student/questions/${language}`);
      setQuestions(res.data);
    } catch (err) {
      console.error("Failed to fetch questions", err);
    }
  };

  const fetchProgress = async () => {
    try {
      const res = await api.get("/student/progress");
      setProgress(res.data);
    } catch (err) {
      console.error("Failed to fetch progress", err);
    }
  };

  const fetchSubmissions = async (questionId) => {
    try {
      const res = await api.get(`/student/submissions/${questionId}`);
      setSubmissions(res.data);
    } catch (err) {
      console.error("Failed to fetch submissions", err);
    }
  };

  const fetchPlagiarism = async (questionId) => {
    try {
      const res = await api.get(`/student/plagiarism/${questionId}`);
      setPlagiarismMatches(res.data);
    } catch (err) {
      console.error("Failed to fetch plagiarism", err);
    }
  };

  const handleQuestionSelect = (q) => {
    setSelectedQuestion(q);
    setCode(q.starter_code || "");
    setOutput("");
    setTestResults(null);
    if (terminalInstance.current) {
      terminalInstance.current.clear();
      terminalInstance.current.writeln("[32m● Interactive Terminal Ready[0m");
      terminalInstance.current.writeln(
        "Click '▶️ Run Code' to start your program.",
      );
    }
  };

  // INTERACTIVE RUN: Start a persistent session via WebSocket
  const handleRunCode = async () => {
    if (!selectedQuestion || !terminalReady) return;

    const term = terminalInstance.current;
    setIsRunning(true);
    term.clear();
    term.writeln("[33m⏳ Compiling and starting program...[0m");
    term.writeln("");

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io("http://localhost:5000/terminal", {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: false,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("start", { code, language });
    });

    socket.on("started", (data) => {
      term.writeln("[32m✅ Program started![0m");
      term.writeln("[36m──────────────────────────────────────[0m");
      term.writeln("");
    });

    socket.on("output", (data) => {
      term.write(data.data);
    });

    socket.on("exit", (data) => {
      term.writeln("");
      term.writeln("[36m──────────────────────────────────────[0m");
      term.writeln(`[33m🏁 Program exited with code: ${data.code}[0m`);
      setIsRunning(false);
      socket.disconnect();
    });

    socket.on("error", (data) => {
      term.writeln("");
      term.writeln(`[31m❌ Error: ${data.message}[0m`);
      setIsRunning(false);
      socket.disconnect();
    });

    socket.on("disconnect", () => {
      setIsRunning(false);
    });

    socket.on("connect_error", (err) => {
      term.writeln(`[31m❌ Connection error: ${err.message}[0m`);
      setIsRunning(false);
    });
  };

  const handleKillProgram = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("kill");
      if (terminalInstance.current) {
        terminalInstance.current.writeln("[31m⏹ Program killed by user.[0m");
      }
    }
    setIsRunning(false);
  };

  // Submit code with AUTO-GRADING
  const handleSubmit = async () => {
    if (!selectedQuestion) return;
    setIsSubmitting(true);
    setOutput("Submitting...");
    setTestResults(null);

    try {
      const res = await api.post("/student/submit", {
        question_id: selectedQuestion.id,
        code,
        language,
      });
      setTestResults(res.data);
      setOutput(
        `Score: ${res.data.score}/${res.data.totalPoints}\nPassed: ${res.data.totalPassed}/${res.data.totalTests} tests`,
      );
      fetchSubmissions(selectedQuestion.id);
      fetchProgress();
    } catch (err) {
      setOutput(err.response?.data?.error || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedQuestion) return;
    try {
      await api.post("/student/draft", {
        question_id: selectedQuestion.id,
        code,
        language,
      });
      alert("Draft saved!");
    } catch (err) {
      alert("Failed to save draft");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const languages = [
    { id: "c", name: "C", icon: "🔵" },
    { id: "cpp", name: "C++", icon: "🟣" },
    { id: "python", name: "Python", icon: "🟡" },
    { id: "java", name: "Java", icon: "☕" },
  ];

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}
    >
      {/* Header */}
      <header
        className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow-md px-6 py-4 flex justify-between items-center`}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">👨‍🎓</span>
          <div>
            <h1 className="text-xl font-bold">Student Portal</h1>
            <p className="text-sm text-gray-500">Welcome, {user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-semibold">{progress.total_score}</span> points
            | <span className="font-semibold">{progress.solved_count}</span>/
            {progress.total_questions} solved
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left: Plagiarism & History Panel */}
        <div
          className={`w-72 ${darkMode ? "bg-gray-800" : "bg-white"} border-r p-4 overflow-y-auto`}
        >
          <h3 className="font-bold mb-4">🔍 Plagiarism Check</h3>
          {plagiarismMatches.length === 0 ? (
            <div className="text-green-500 text-sm">
              ✅ No plagiarism detected
              <br />
              <span className="text-gray-500">Threshold: 85% similarity</span>
            </div>
          ) : (
            <div className="text-red-500">
              ⚠️ {plagiarismMatches.length} match(es) found!
              {plagiarismMatches.map((match) => (
                <div
                  key={match.student_id}
                  className="mt-2 p-2 bg-red-50 rounded"
                >
                  <div className="font-semibold">{match.name}</div>
                  <div>{match.similarity}% similar</div>
                </div>
              ))}
            </div>
          )}

          {submissions.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold mb-3">📜 History</h3>
              {submissions.slice(0, 5).map((sub, i) => (
                <div
                  key={sub.id}
                  className={`p-3 rounded-lg mb-2 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
                >
                  <div className="text-sm font-semibold">
                    Attempt #{submissions.length - i}
                  </div>
                  <div
                    className={`text-sm ${(sub.score || 0) > 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    Score: {sub.score || 0}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(sub.submitted_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center: Code Editor + Terminal */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div
            className={`${darkMode ? "bg-gray-800" : "bg-white"} border-b px-4 py-3 flex justify-between items-center`}
          >
            <div className="flex items-center gap-4">
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setSelectedQuestion(null);
                  setCode("");
                }}
                className={`px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.icon} {lang.name}
                  </option>
                ))}
              </select>
              {selectedQuestion && (
                <div>
                  <span className="font-bold">{selectedQuestion.title}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    {selectedQuestion.points} pts
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                💾 Save Draft
              </button>
              {isRunning ? (
                <button
                  onClick={handleKillProgram}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  ⏹ Stop Program
                </button>
              ) : (
                <button
                  onClick={handleRunCode}
                  disabled={!terminalReady}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                >
                  ▶️ Run Code
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                {isSubmitting ? "⏳ Submitting..." : "✅ Submit"}
              </button>
            </div>
          </div>

          {/* Question Info - REMOVED time limit and memory display */}
          {selectedQuestion && (
            <div
              className={`px-4 py-3 ${darkMode ? "bg-gray-800" : "bg-blue-50"} border-b`}
            >
              <p className="text-sm">{selectedQuestion.description}</p>
            </div>
          )}

          {/* Monaco Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : language}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme={darkMode ? "vs-dark" : "light"}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                automaticLayout: true,
                readOnly: false,
              }}
            />
          </div>

          {/* Interactive Terminal (xterm.js) */}
          <div
            className="border-t border-gray-700"
            style={{
              height: "280px",
              minHeight: "200px",
              position: "relative",
            }}
          >
            <div className="bg-gray-900 px-3 py-1 flex items-center justify-between">
              <span className="text-green-400 text-xs font-mono">
                ● Interactive Terminal
              </span>
              <span className="text-gray-500 text-xs">
                {isRunning
                  ? "🟢 Program Running — Type input directly here"
                  : "⏸ Ready"}
              </span>
            </div>
            <div
              ref={terminalRef}
              style={{
                position: "absolute",
                top: "24px",
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "#1e1e1e",
              }}
            />
          </div>
        </div>

        {/* Right: Question Panel */}
        <div
          className={`w-80 ${darkMode ? "bg-gray-800" : "bg-white"} border-l p-4 overflow-y-auto`}
        >
          <h3 className="font-bold mb-4">📋 Questions</h3>
          {questions.map((q) => (
            <div
              key={q.id}
              onClick={() => handleQuestionSelect(q)}
              className={`p-4 rounded-xl cursor-pointer transition-all mb-3 ${
                selectedQuestion?.id === q.id
                  ? "bg-blue-50 border-2 border-blue-500 shadow-md"
                  : darkMode
                    ? "bg-gray-700 hover:bg-gray-600 border-2 border-transparent"
                    : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-semibold text-blue-500 uppercase">
                  {q.language.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">{q.points} pts</span>
              </div>
              <h4 className="font-semibold text-sm">{q.title}</h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {q.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
