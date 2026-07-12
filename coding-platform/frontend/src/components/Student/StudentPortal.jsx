import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import api from "../../services/api";

// Semester I students only ever see C; Semester II students only ever see C++.
// This is a hard lock, not a default — students cannot switch languages.
const SEMESTER_LANGUAGE = { I: "c", II: "cpp" };

// A synthetic "question" that puts the editor in unrestricted practice
// mode — not tied to grading, submission, or plagiarism checks. It never
// leaves the browser (no backend call uses its id); handlers below
// special-case it via the isFreePractice flag.
const makeFreePracticeEntry = (language) => ({
  id: "free-practice",
  title: "Free Practice",
  language,
  points: 0,
  isFreePractice: true,
});

// Renders one titled list of question cards (used for both the
// Assignments and Extra Practice sections so the card markup and
// submitted-checkmark logic only live in one place).
const QuestionGroup = ({
  title,
  questions,
  selectedQuestion,
  submissionStatus,
  darkMode,
  onSelect,
  emptyLabel,
}) => (
  <div className="mb-6">
    <h2 className="text-lg font-bold mb-4">{title}</h2>
    <div className="space-y-3">
      {questions.map((q) => {
        const isQSubmitted = submissionStatus[q.id] === "submitted";
        return (
          <button
            key={q.id}
            onClick={() => onSelect(q)}
            className={`w-full text-left p-4 rounded-lg border transition-all ${
              selectedQuestion?.id === q.id
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : darkMode
                  ? "border-gray-700 hover:bg-gray-700"
                  : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{q.title}</span>
              {isQSubmitted && (
                <span className="text-green-500 text-lg" title="Submitted">
                  ✅
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {q.points} points • {q.language.toUpperCase()}
            </div>
          </button>
        );
      })}
      {questions.length === 0 && (
        <p className="text-sm text-gray-400">{emptyLabel}</p>
      )}
    </div>
  </div>
);

const StudentPortal = () => {
  const initialUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [language] = useState(SEMESTER_LANGUAGE[initialUser.semester] || "cpp");
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
  const [clipboardWarning, setClipboardWarning] = useState(""); // "" | "paste" | "copy"
  const [submissionStatus, setSubmissionStatus] = useState({}); // NEW: Track submitted questions
  const [isSubmitted, setIsSubmitted] = useState(false); // NEW: Current question submitted state
  const [isEditing, setIsEditing] = useState(false); // NEW: Edit mode after submission
  const [terminalOutput, setTerminalOutput] = useState(""); // NEW: Accumulate terminal output
  // Small text files the student attaches so their code's fopen()/ifstream
  // calls have something real to read during interactive Run. Cleared on
  // question switch. Kept small (enforced both client and server side).
  const [attachedFiles, setAttachedFiles] = useState([]); // [{ name, content }]
  // Submit only becomes available after the current code has been run in the
  // terminal and finished cleanly (compiled, exited with code 0). Any edit to
  // the code, or switching questions, clears this until the next clean run.
  const [canSubmit, setCanSubmit] = useState(false);

  const terminalRef = useRef(null);
  const terminalInstance = useRef(null);
  const fitAddon = useRef(null);
  const socketRef = useRef(null);
  // Tracks the backend's current container session so repeated Run clicks
  // reuse the same warm container instead of paying full container
  // startup cost every time. Reset to null on question switch (new
  // container) or disconnect/error (container gone).
  const activeContainerSessionId = useRef(null);
  // Files the student attaches for the interactive terminal so fopen()/
  // ifstream-style code has something real to read while testing, before
  // submitting. Not persisted — cleared on question switch, like terminalOutput.
  const [testFiles, setTestFiles] = useState([]); // [{ name, content }]
  // Populated from the "exit" event: what each attached file actually
  // contained after the program ran (so writes made via fopen(..., "w")
  // are visible, not just the content the student typed in beforehand).
  const [testFileOutputs, setTestFileOutputs] = useState({}); // { [name]: content }
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const terminalOutputRef = useRef(""); // Ref to accumulate output without re-renders
  // The Monaco editor instance mounts once and persists across question
  // switches, so its copy/paste key handlers close over stale state if they
  // read `selectedQuestion` directly. This ref is kept current instead.
  const isFreePracticeRef = useRef(false);
  useEffect(() => {
    isFreePracticeRef.current = !!selectedQuestion?.isFreePractice;
  }, [selectedQuestion]);
  // Monaco's addCommand shortcuts are registered once on mount, so calling
  // handleRunCode/handleSaveDraft/handleSubmit/handleKillProgram directly
  // would freeze them to their first-render closures (stale selectedQuestion,
  // isRunning, etc). These refs are refreshed every render so the shortcuts
  // always call the current version — the handlers keep their own existing
  // guards, so this only adds a key trigger, it doesn't change what's allowed.
  const handleRunCodeRef = useRef(() => {});
  const handleSaveDraftRef = useRef(() => {});
  const handleSubmitRef = useRef(() => {});
  const handleKillProgramRef = useRef(() => {});
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // ============================================
  // COPY-PASTE PREVENTION (Assignments & Extra Practice only —
  // Free Practice is exempt and behaves like a normal editor)
  // ============================================
  // Free Practice is handled with a Monaco context key + "when" clause
  // rather than intercept-and-replay: the override command only matches
  // when `clipboardRestricted` is true, so in Free Practice the keybinding
  // isn't claimed at all and Monaco's real built-in paste/copy/cut fires
  // natively. (Replaying paste programmatically doesn't work reliably —
  // browsers block scripted paste as a clipboard-security measure.)
  const clipboardRestrictedKeyRef = useRef(null);
  useEffect(() => {
    clipboardRestrictedKeyRef.current?.set(!selectedQuestion?.isFreePractice);
  }, [selectedQuestion]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const restrictedKey = editor.createContextKey(
      "clipboardRestricted",
      !selectedQuestion?.isFreePractice,
    );
    clipboardRestrictedKeyRef.current = restrictedKey;

    // Block Ctrl+V / Cmd+V / Shift+Insert / Ctrl+C / Ctrl+X via keydown
    // (belt-and-suspenders alongside the addCommand overrides below).
    editor.onKeyDown((e) => {
      if (!restrictedKey.get()) return;

      const keyCode = e.keyCode;
      const ctrl = e.ctrlKey;
      const meta = e.metaKey;

      if ((ctrl || meta) && keyCode === monaco.KeyCode.KeyV) {
        e.preventDefault();
        e.stopPropagation();
        showClipboardWarning("paste");
        return false;
      }

      if (e.shiftKey && keyCode === monaco.KeyCode.Insert) {
        e.preventDefault();
        e.stopPropagation();
        showClipboardWarning("paste");
        return false;
      }

      if (
        (ctrl || meta) &&
        (keyCode === monaco.KeyCode.KeyC || keyCode === monaco.KeyCode.KeyX)
      ) {
        e.preventDefault();
        e.stopPropagation();
        showClipboardWarning("copy");
        return false;
      }
    });

    // Each override only activates "when" clipboardRestricted is true. When
    // it's false (Free Practice), the keybinding isn't claimed at all and
    // Monaco's built-in clipboard command handles the key press normally.
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV,
      () => showClipboardWarning("paste"),
      "clipboardRestricted",
    );
    editor.addCommand(
      monaco.KeyMod.Shift | monaco.KeyCode.Insert,
      () => showClipboardWarning("paste"),
      "clipboardRestricted",
    );
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC,
      () => showClipboardWarning("copy"),
      "clipboardRestricted",
    );
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX,
      () => showClipboardWarning("copy"),
      "clipboardRestricted",
    );

    // ============================================
    // KEYBOARD SHORTCUTS (all sections — same actions the buttons already
    // trigger, so no new functionality, just faster access to it)
    // ============================================
    // Run: Ctrl/Cmd + Enter
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRunCodeRef.current();
    });
    // Save Draft: Ctrl/Cmd + S (also stops the browser's Save Page dialog
    // while the editor is focused; handleSaveDraft already no-ops in Free
    // Practice / when nothing is selected, same as the button)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSaveDraftRef.current();
    });
    // Submit / Re-Submit: Ctrl/Cmd + Shift + Enter
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
      () => {
        handleSubmitRef.current();
      },
    );
    // Stop running program: Ctrl/Cmd + Shift + X
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyX,
      () => {
        handleKillProgramRef.current();
      },
    );

    editor.updateOptions({ contextmenu: false });
  };

  const showClipboardWarning = (action) => {
    setClipboardWarning(action);
    setTimeout(() => setClipboardWarning(""), 3000);
  };

  const handleContainerPaste = (e) => {
    if (isFreePracticeRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    showClipboardWarning("paste");
    return false;
  };

  const handleContainerCopy = (e) => {
    if (isFreePracticeRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    showClipboardWarning("copy");
    return false;
  };

  const handleContainerCut = (e) => {
    if (isFreePracticeRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    showClipboardWarning("copy");
    return false;
  };

  // ============================================
  // TERMINAL INITIALIZATION
  // ============================================
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

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            fitAddon.current.fit();
          } catch (e) {
            console.warn("Initial fit failed:", e);
          }
        });
      });

      term.writeln("● Interactive Terminal Ready");
      term.writeln("Click '▶️ Run Code' to start your program.");
      term.writeln("Type input and press Enter when the program asks for it.");
      term.writeln("");

      // OPTIMIZED: Buffer input until Enter is pressed
      let inputBuffer = "";
      term.onData((data) => {
        if (!socketRef.current || !socketRef.current.connected) return;

        // Echo the character to terminal for visual feedback
        term.write(data);

        // Check for Enter key (\r or \n)
        if (data === "\r" || data === "\n") {
          // Send the complete buffered line
          const lineToSend = inputBuffer;
          inputBuffer = "";
          term.write("\r\n"); // New line in terminal
          socketRef.current.emit("input", { input: lineToSend + "\n" });
        } else if (data === "\x7f" || data === "\b") {
          // Backspace handling
          if (inputBuffer.length > 0) {
            inputBuffer = inputBuffer.slice(0, -1);
            term.write("\b \b"); // Erase character visually
          }
        } else {
          // Accumulate character
          inputBuffer += data;
        }
      });

      terminalInstance.current = term;
      setTerminalReady(true);
    };

    rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(initTerminal);
    });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (term) term.dispose();
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
    fetchSubmissionStatus();
  }, [language]);

  useEffect(() => {
    if (!selectedQuestion) return;

    if (selectedQuestion.isFreePractice) {
      // Free practice is never submitted or checked for plagiarism —
      // skip the network calls entirely rather than hitting the backend
      // with a non-numeric question id.
      setIsSubmitted(false);
      setIsEditing(false);
      setSubmissions([]);
      setPlagiarismMatches([]);
      return;
    }

    fetchSubmissions(selectedQuestion.id);
    fetchPlagiarism(selectedQuestion.id);
    // Check if this question is already submitted
    setIsSubmitted(submissionStatus[selectedQuestion.id] === "submitted");
    setIsEditing(false);
  }, [selectedQuestion, submissionStatus]);

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

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const res = await api.get("/student/submissions/pdf", {
        responseType: "blob",
        timeout: 30000, // generating many pages can take longer than the default 10s
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my_submissions.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err.response?.status === 404) {
        alert("You haven't submitted any programs yet — nothing to download.");
      } else {
        alert("Failed to download PDF. Please try again.");
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // NEW: Fetch submission status for all questions
  const fetchSubmissionStatus = async () => {
    try {
      const res = await api.get("/student/submission-status");
      setSubmissionStatus(res.data);
    } catch (err) {
      console.error("Failed to fetch submission status", err);
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
    setCode(
      q.isFreePractice
        ? "// Write anything here — this space isn't graded or submitted.\n// Use Run to compile and test your code.\n"
        : q.starter_code || "",
    );
    setOutput("");
    setTestResults(null);
    setTerminalOutput("");
    terminalOutputRef.current = "";
    setTestFiles([]);
    setTestFileOutputs({});
    setIsSubmitted(false);
    setIsEditing(false);
    setCanSubmit(false);
    if (terminalInstance.current) {
      terminalInstance.current.clear();
      terminalInstance.current.writeln("● Interactive Terminal Ready");
      terminalInstance.current.writeln(
        "Click '▶️ Run Code' to start your program.",
      );
    }
  };

  // INTERACTIVE RUN - OPTIMIZED
  const handleRunCode = async () => {
    if (!selectedQuestion || !terminalReady) return;

    const term = terminalInstance.current;
    setIsRunning(true);
    setCanSubmit(false);
    setTestFileOutputs({}); // clear last run's readback — it's about to be stale
    term.clear();
    term.writeln("⏳ Compiling and starting program...");
    term.writeln("");

    // Reset output accumulator
    terminalOutputRef.current = "⏳ Compiling and starting program...\n\n";
    setTerminalOutput("");

    // Reuse the existing socket (and therefore the existing warm container
    // server-side) whenever one is already connected for this same
    // language, instead of disconnecting and reconnecting on every Run —
    // reconnecting forces the backend to spin up a brand-new Docker
    // container each time, which was the actual source of run latency.
    let socket = socketRef.current;
    const needsNewSocket =
      !socket || !socket.connected || socket.lastLanguage !== language;

    if (needsNewSocket) {
      if (socket) socket.disconnect();
      activeContainerSessionId.current = null;

      socket = io("http://localhost:5000/terminal", {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: false,
        timeout: 10000,
      });
      socket.lastLanguage = language;
      socketRef.current = socket;

      socket.on("started", (data) => {
        activeContainerSessionId.current = data.sessionId;
        term.writeln("✅ Program started!");
        term.writeln("──────────────────────────────────────");
        term.writeln("");
        terminalOutputRef.current +=
          "✅ Program started!\n──────────────────────────────────────\n\n";
      });

      socket.on("output", (data) => {
        term.write(data.data);
        terminalOutputRef.current += data.data;
      });

      socket.on("exit", (data) => {
        term.writeln("");
        term.writeln("──────────────────────────────────────");
        term.writeln(`🏁 Program exited with code: ${data.code}`);
        terminalOutputRef.current += `\n──────────────────────────────────────\n🏁 Program exited with code: ${data.code}\n`;
        setIsRunning(false);
        setTerminalOutput(terminalOutputRef.current);
        setCanSubmit(data.code === 0);
        // Show what the program actually wrote to each attached file.
        const outputs = {};
        (data.files || []).forEach((f) => {
          outputs[f.name] = f.content;
        });
        setTestFileOutputs(outputs);
        // Note: container stays alive here (no socket.disconnect()) so the
        // next Run reuses it. It's torn down on disconnect, question
        // switch, or unmount.
      });

      socket.on("error", (data) => {
        term.writeln("");
        term.writeln(`❌ Error: ${data.message}`);
        terminalOutputRef.current += `\n❌ Error: ${data.message}\n`;
        setIsRunning(false);
        setTerminalOutput(terminalOutputRef.current);
        setCanSubmit(false);
        activeContainerSessionId.current = null;
      });

      socket.on("disconnect", () => {
        setIsRunning(false);
        activeContainerSessionId.current = null;
      });

      socket.on("connect_error", (err) => {
        term.writeln(`❌ Connection error: ${err.message}`);
        terminalOutputRef.current += `❌ Connection error: ${err.message}\n`;
        setIsRunning(false);
        setTerminalOutput(terminalOutputRef.current);
        setCanSubmit(false);
      });

      socket.on("connect", () => {
        socket.emit("start", { code, language, files: testFiles });
      });
      return;
    }

    // Warm path: socket already connected for this language, just kick off
    // another run on the existing container. Listeners were already
    // registered when this socket was first created above.
    socket.emit("start", { code, language, files: testFiles });
  };

  const handleKillProgram = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("kill");
      if (terminalInstance.current) {
        terminalInstance.current.writeln("⏹ Program killed by user.");
      }
    }
    setIsRunning(false);
  };

  // Submit code with AUTO-GRADING + terminal output
  const handleSubmit = async () => {
    if (!selectedQuestion || selectedQuestion.isFreePractice) return;
    // Mirrors exactly what makes the Submit/Re-Submit button visible —
    // needed because the Ctrl/Cmd+Shift+Enter shortcut calls this directly,
    // bypassing the button's disabled/hidden state entirely.
    if (!canSubmit) return;
    if (isSubmitted && !isEditing) return;
    setIsSubmitting(true);
    setOutput("Submitting...");
    setTestResults(null);

    try {
      const res = await api.post("/student/submit", {
        question_id: selectedQuestion.id,
        code,
        language,
        terminal_output: terminalOutputRef.current || terminalOutput,
      });

      setTestResults(res.data);
      setOutput(
        `Score: ${res.data.score}/${res.data.totalPoints}\nPassed: ${res.data.totalPassed}/${res.data.totalTests} tests`,
      );

      // IMMEDIATE STATE UPDATE
      setIsSubmitted(true);
      setIsEditing(false);

      // Refresh all related data
      await Promise.all([
        fetchSubmissions(selectedQuestion.id),
        fetchProgress(),
        fetchSubmissionStatus(),
      ]);
    } catch (err) {
      setOutput(err.response?.data?.error || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // NEW: Enable editing after submission
  const handleEdit = () => {
    setIsEditing(true);
    setIsSubmitted(false);
    setOutput("");
    setTestResults(null);
  };

  const handleSaveDraft = async () => {
    if (!selectedQuestion || selectedQuestion.isFreePractice) return;
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

  // Runs after every render so the Monaco keyboard shortcuts (registered
  // once on mount) always call the current handler, not a stale closure.
  useEffect(() => {
    handleRunCodeRef.current = handleRunCode;
    handleSaveDraftRef.current = handleSaveDraft;
    handleSubmitRef.current = handleSubmit;
    handleKillProgramRef.current = handleKillProgram;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const languageBadge =
    language === "c"
      ? { name: "C Programming", icon: "🔵" }
      : { name: "C++ Programming", icon: "🟣" };

  const getMonacoLanguage = (lang) => {
    const map = {
      c: "c",
      cpp: "cpp",
      python: "python",
      java: "java",
    };
    return map[lang] || "plaintext";
  };

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
            <p className="text-sm text-gray-500">
              Welcome, {user.name} · Semester {user.semester}
            </p>
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
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Toggle Dark Mode"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Locked language badge — determined by the student's semester, not user-selectable */}
      <div
        className={`${darkMode ? "bg-gray-800" : "bg-white"} px-6 py-3 shadow-sm`}
      >
        <div className="flex gap-3">
          <span className="px-4 py-2 rounded-lg font-medium bg-blue-500 text-white shadow-md">
            <span className="mr-2">{languageBadge.icon}</span>
            {languageBadge.name}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Left Sidebar - Questions */}
        <div
          className={`w-80 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-r overflow-y-auto p-4`}
        >
          {/* Free Practice - always available, never graded */}
          <h2 className="text-lg font-bold mb-3">🧑‍💻 Practice Space</h2>
          <button
            onClick={() =>
              handleQuestionSelect(makeFreePracticeEntry(language))
            }
            className={`w-full text-left p-4 rounded-lg border transition-all mb-6 ${
              selectedQuestion?.isFreePractice
                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                : darkMode
                  ? "border-gray-700 hover:bg-gray-700"
                  : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="font-semibold">Free Practice</div>
            <div className="text-sm text-gray-500 mt-1">
              Open editor · not graded · nothing submitted
            </div>
          </button>

          <QuestionGroup
            title="📘 Assignments"
            questions={questions.filter((q) => q.category !== "practice")}
            selectedQuestion={selectedQuestion}
            submissionStatus={submissionStatus}
            darkMode={darkMode}
            onSelect={handleQuestionSelect}
            emptyLabel="No assignments yet."
          />

          <QuestionGroup
            title="🧪 Extra Practice"
            questions={questions.filter((q) => q.category === "practice")}
            selectedQuestion={selectedQuestion}
            submissionStatus={submissionStatus}
            darkMode={darkMode}
            onSelect={handleQuestionSelect}
            emptyLabel="No extra practice questions yet."
          />

          {/* Plagiarism Section */}
          {plagiarismMatches.length > 0 && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h3 className="text-red-600 dark:text-red-400 font-bold mb-2">
                ⚠️ Plagiarism Alert
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Similar code detected:
              </p>
              <ul className="space-y-2">
                {plagiarismMatches.map((match, idx) => (
                  <li
                    key={idx}
                    className="text-sm p-2 bg-white dark:bg-gray-800 rounded border"
                  >
                    <span className="font-semibold">{match.name}</span>
                    <span className="text-red-500 ml-2">
                      {match.similarity}% match
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Center - Code Editor */}
        <div className="flex-1 flex flex-col">
          {/* Clipboard Restriction Banner */}
          {clipboardWarning && (
            <div className="bg-red-500 text-white px-4 py-2 text-center font-semibold animate-pulse z-50">
              {clipboardWarning === "paste"
                ? "🚫 Paste is disabled here! Please type your code manually."
                : "🚫 Copy is disabled here! Free Practice is the only place code can be copied out."}
            </div>
          )}

          {/* Editor Header */}
          <div
            className={`${darkMode ? "bg-gray-800" : "bg-gray-100"} px-4 py-2 flex justify-between items-center`}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {selectedQuestion
                  ? selectedQuestion.title
                  : "Select a question"}
              </span>
              {selectedQuestion && (
                <span className="text-sm text-gray-500">
                  ({selectedQuestion.language.toUpperCase()})
                </span>
              )}
              {selectedQuestion?.isFreePractice && (
                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">
                  🧑‍💻 PRACTICE · NOT GRADED
                </span>
              )}
              {isSubmitted && !isEditing && (
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">
                  ✅ SUBMITTED
                </span>
              )}
              {isEditing && (
                <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold">
                  ✏️ EDITING
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {!selectedQuestion?.isFreePractice && (
                <button
                  onClick={handleSaveDraft}
                  disabled={!selectedQuestion}
                  title="Save Draft (Ctrl/Cmd+S)"
                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm"
                >
                  💾 Save Draft
                </button>
              )}
              <button
                onClick={handleRunCode}
                disabled={!selectedQuestion || isRunning}
                title="Run Code (Ctrl/Cmd+Enter)"
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
              >
                {isRunning ? "⏳ Running..." : "▶️ Run Code"}
              </button>
              {isRunning && (
                <button
                  onClick={handleKillProgram}
                  title="Stop (Ctrl/Cmd+Shift+X)"
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  ⏹ Stop
                </button>
              )}

              {/* Submit / Submitted / Edit buttons - not shown in free practice.
                  Submit and Re-Submit only appear after a clean Run; Edit
                  (which just unlocks the editor, doesn't submit) always shows. */}
              {!selectedQuestion?.isFreePractice &&
                (!isSubmitted ? (
                  canSubmit && (
                    <button
                      onClick={handleSubmit}
                      disabled={!selectedQuestion || isSubmitting}
                      title="Submit (Ctrl/Cmd+Shift+Enter)"
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
                    >
                      {isSubmitting ? "⏳ Submitting..." : "📤 Submit"}
                    </button>
                  )
                ) : !isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                  >
                    ✏️ Edit
                  </button>
                ) : (
                  canSubmit && (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      title="Submit (Ctrl/Cmd+Shift+Enter)"
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
                    >
                      {isSubmitting ? "⏳ Submitting..." : "📤 Re-Submit"}
                    </button>
                  )
                ))}
            </div>
          </div>

          {/* Shortcuts hint - contextual per section, purely informational */}
          {selectedQuestion && (
            <div
              className={`px-4 py-1 text-xs ${darkMode ? "bg-gray-900 text-gray-500" : "bg-gray-50 text-gray-400"} border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              ⌨️ Ctrl/Cmd+Enter Run
              {!selectedQuestion.isFreePractice &&
                " · Ctrl/Cmd+S Save Draft · Ctrl/Cmd+Shift+Enter Submit"}
              {isRunning && " · Ctrl/Cmd+Shift+X Stop"}
              {selectedQuestion.isFreePractice
                ? " · Ctrl/Cmd+C/V/X Copy/Paste/Cut enabled"
                : " · Copy/Paste disabled here"}
            </div>
          )}

          {/* Test Files — attached for the interactive Run only, so
              fopen()/ifstream-style code has real files to read while the
              student is experimenting. Separate from the teacher-defined
              input_files used at grading time. */}
          {selectedQuestion && (language === "c" || language === "cpp") && (
            <div
              className={`px-4 py-2 border-b text-xs ${darkMode ? "bg-gray-900 border-gray-700 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-500"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">
                  📄 Test Files ({testFiles.length}/5)
                </span>
                <button
                  onClick={() =>
                    setTestFiles((prev) =>
                      prev.length >= 5
                        ? prev
                        : [...prev, { name: `data${prev.length + 1}.txt`, content: "" }],
                    )
                  }
                  disabled={testFiles.length >= 5}
                  className="px-2 py-0.5 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  + Add file
                </button>
              </div>
              {testFiles.map((f, idx) => (
                <div key={idx} className="mb-1">
                  <div className="flex gap-2 items-start">
                    <input
                      value={f.name}
                      onChange={(e) =>
                        setTestFiles((prev) =>
                          prev.map((pf, i) =>
                            i === idx ? { ...pf, name: e.target.value } : pf,
                          ),
                        )
                      }
                      placeholder="filename.txt"
                      className={`px-2 py-1 rounded border w-32 ${darkMode ? "bg-gray-800 border-gray-600 text-gray-200" : "bg-white border-gray-300"}`}
                    />
                    <textarea
                      value={f.content}
                      onChange={(e) =>
                        setTestFiles((prev) =>
                          prev.map((pf, i) =>
                            i === idx ? { ...pf, content: e.target.value } : pf,
                          ),
                        )
                      }
                      placeholder="File contents your program will fopen()/read..."
                      rows={2}
                      className={`px-2 py-1 rounded border flex-1 font-mono ${darkMode ? "bg-gray-800 border-gray-600 text-gray-200" : "bg-white border-gray-300"}`}
                    />
                    <button
                      onClick={() =>
                        setTestFiles((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="px-2 py-1 text-red-500 hover:text-red-600"
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                  {/* Read-only readback of what the last run actually left in
                      this file — only shown once we have a result, and only
                      if it differs from what's typed above (fopen "w"/"a"
                      would change it; a program that only reads it won't). */}
                  {Object.prototype.hasOwnProperty.call(testFileOutputs, f.name) && (
                    <div className="flex gap-2 items-start mt-1 ml-[8.5rem]">
                      <span className="text-xs pt-1 opacity-70 w-10 shrink-0">
                        after run:
                      </span>
                      {testFileOutputs[f.name] === null ? (
                        <span className="text-xs italic pt-1 text-red-400">
                          file no longer exists (program deleted it)
                        </span>
                      ) : (
                        <textarea
                          readOnly
                          value={testFileOutputs[f.name]}
                          rows={2}
                          className={`px-2 py-1 rounded border flex-1 font-mono text-xs ${darkMode ? "bg-gray-800/50 border-gray-700 text-gray-400" : "bg-gray-100 border-gray-200 text-gray-600"}`}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
              {testFiles.length === 0 && (
                <div className="italic opacity-70">
                  No test files attached — add one if your code uses fopen() to read a file.
                </div>
              )}
            </div>
          )}

          {/* Monaco Editor with Copy-Paste Restriction (Assignments/Extra Practice only) */}
          <div
            className="flex-1 relative"
            onPaste={handleContainerPaste}
            onCopy={handleContainerCopy}
            onCut={handleContainerCut}
          >
            <Editor
              height="100%"
              language={getMonacoLanguage(language)}
              value={code}
              onChange={(value) => {
                setCode(value || "");
                setCanSubmit(false);
              }}
              onMount={handleEditorDidMount}
              theme={darkMode ? "vs-dark" : "light"}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: !selectedQuestion || (isSubmitted && !isEditing),
                automaticLayout: true,
                contextmenu: false,
              }}
            />
          </div>

          {/* Terminal Output */}
          <div
            className={`h-48 ${darkMode ? "bg-gray-900" : "bg-gray-100"} border-t`}
          >
            <div className="px-4 py-2 text-sm font-semibold text-gray-500 flex justify-between">
              <span>Terminal Output</span>
              {output && <span className="text-xs">{output}</span>}
            </div>
            <div ref={terminalRef} className="h-full w-full px-4 pb-4" />
          </div>
        </div>

        {/* Right Sidebar - Submissions & Info */}
        <div
          className={`w-72 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-l overflow-y-auto p-4`}
        >
          <h2 className="text-lg font-bold mb-4">📊 Progress</h2>
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {progress.solved_count}/{progress.total_questions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Questions Solved
            </div>
            <div className="mt-2 text-lg font-semibold">
              {progress.total_score} points
            </div>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="w-full mb-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
            {isDownloadingPdf ? "Generating PDF..." : "📄 Download All Submissions (PDF)"}
          </button>

          {submissions.length > 0 && (
            <>
              <h2 className="text-lg font-bold mb-4">📝 Submissions</h2>
              <div className="space-y-2">
                {submissions.slice(0, 5).map((sub, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-sm ${
                      sub.status === "submitted"
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200"
                        : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200"
                    }`}
                  >
                    <div className="font-semibold">
                      {sub.status === "submitted" ? "✅ Submitted" : "📝 Draft"}
                    </div>
                    <div className="text-gray-500">
                      Score: {sub.score || 0}/
                      {sub.total_points || selectedQuestion?.points || 10}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(sub.submitted_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {testResults && (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 rounded-lg">
              <h3 className="font-bold text-purple-600 dark:text-purple-400 mb-2">
                🧪 Test Results
              </h3>
              <div className="text-sm">
                <div>
                  Passed: {testResults.totalPassed}/{testResults.totalTests}
                </div>
                <div>
                  Score: {testResults.score}/{testResults.totalPoints}
                </div>
                <div>Time: {testResults.executionTimeMs}ms</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
