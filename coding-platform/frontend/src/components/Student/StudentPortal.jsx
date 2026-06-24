import React, { useState, useEffect, useCallback, useRef } from "react";
import Editor from "@monaco-editor/react";
import api from "../../services/api";

const StudentPortal = () => {
  const [language, setLanguage] = useState("c");
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plagiarismMatches, setPlagiarismMatches] = useState([]);
  const [testResults, setTestResults] = useState(null);
  const [progress, setProgress] = useState({
    solved_count: 0,
    total_score: 0,
    total_questions: 0,
  });
  const [pasteBlocked, setPasteBlocked] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const autoSaveTimer = useRef(null);
  const editorRef = useRef(null);
  const pasteBlockTimer = useRef(null);

  // Fetch questions and progress on mount
  useEffect(() => {
    fetchQuestions();
    fetchProgress();
  }, [language]);

  // Auto-save draft every 10 seconds
  useEffect(() => {
    if (selectedQuestion && code && !isSubmitting) {
      autoSaveTimer.current = setTimeout(() => {
        saveDraft();
      }, 10000);
    }
    return () => clearTimeout(autoSaveTimer.current);
  }, [code, selectedQuestion]);

  const fetchQuestions = async () => {
    try {
      const res = await api.get(`/student/questions/${language}`);
      setQuestions(res.data);
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    }
  };

  const fetchProgress = async () => {
    try {
      const res = await api.get("/student/progress");
      setProgress(res.data);
    } catch (err) {
      console.error("Failed to fetch progress:", err);
    }
  };

  const fetchSubmissions = async (questionId) => {
    try {
      const res = await api.get(`/student/submissions/${questionId}`);
      setSubmissions(res.data);
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    }
  };

  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
    setCode(question.starter_code || "");
    setOutput("");
    setTestResults(null);
    fetchSubmissions(question.id);
    fetchPlagiarism(question.id);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setSelectedQuestion(null);
    setCode("");
    setOutput("");
    setTestResults(null);
  };

  const handleEditorChange = (value) => {
    setCode(value || "");
  };

  // BLOCK all paste operations completely
  const handlePaste = (e) => {
    e.preventDefault();
    e.stopPropagation();
    showPasteBlocked();
    return false;
  };

  // BLOCK keyboard paste shortcuts (Ctrl+V, Cmd+V, Ctrl+Shift+V)
  const handleKeyDown = (e) => {
    // Ctrl+V or Cmd+V
    if ((e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "V")) {
      e.preventDefault();
      e.stopPropagation();
      showPasteBlocked();
      return false;
    }
    // Ctrl+Shift+V (paste as plain text)
    if (
      (e.ctrlKey || e.metaKey) &&
      e.shiftKey &&
      (e.key === "v" || e.key === "V")
    ) {
      e.preventDefault();
      e.stopPropagation();
      showPasteBlocked();
      return false;
    }
  };

  const showPasteBlocked = () => {
    setPasteBlocked(true);
    clearTimeout(pasteBlockTimer.current);
    pasteBlockTimer.current = setTimeout(() => setPasteBlocked(false), 2000);
  };

  // Configure Monaco editor to block paste
  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;

    // Block paste command in Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      showPasteBlocked();
      return null;
    });

    // Block Ctrl+Shift+V
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyV,
      () => {
        showPasteBlocked();
        return null;
      },
    );

    // Block right-click context menu paste
    editor.onContextMenu((e) => {
      // The context menu will still show but paste won't work
      // due to the paste handler below
    });

    // Override the paste handler at the editor level
    const originalPaste = editor.getAction(
      "editor.action.clipboardPasteAction",
    );
    if (originalPaste) {
      editor.addAction({
        id: "editor.action.clipboardPasteAction",
        label: "Paste",
        keybindings: [],
        run: () => {
          showPasteBlocked();
          return Promise.resolve();
        },
      });
    }
  };

  const runCode = async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    setOutput("Running...");
    setTestResults(null);

    try {
      const res = await api.post("/student/compile", { code, language });
      setOutput(res.data.output || "No output");
    } catch (err) {
      setOutput(err.response?.data?.error || "Execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  const saveDraft = async () => {
    if (!selectedQuestion || !code.trim()) return;
    try {
      await api.post("/student/draft", {
        question_id: selectedQuestion.id,
        code,
        language,
      });
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  };

  const submitCode = async () => {
    if (!selectedQuestion || !code.trim()) return;
    setIsSubmitting(true);
    setOutput("Submitting and grading...");
    setTestResults(null);

    try {
      const res = await api.post("/student/submit", {
        question_id: selectedQuestion.id,
        code,
        language,
      });

      const data = res.data;
      setTestResults(data);
      setOutput(
        data.success
          ? `✅ All ${data.totalTests} tests passed! Score: ${data.score}/${data.totalPoints}`
          : `⚠️ ${data.totalPassed}/${data.totalTests} tests passed. Score: ${data.score}/${data.totalPoints}`,
      );

      fetchProgress();
      fetchSubmissions(selectedQuestion.id);
      fetchPlagiarism(selectedQuestion.id);
    } catch (err) {
      setOutput(err.response?.data?.error || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchPlagiarism = async (questionId) => {
    try {
      const res = await api.get(`/student/plagiarism/${questionId}`);
      setPlagiarismMatches(res.data);
    } catch (err) {
      console.error("Plagiarism check failed:", err);
    }
  };

  const getLanguageForMonaco = () => {
    switch (language) {
      case "c":
        return "c";
      case "cpp":
        return "cpp";
      case "python":
        return "python";
      case "java":
        return "java";
      default:
        return "c";
    }
  };

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"} transition-colors`}
    >
      {/* Paste Blocked Notification */}
      {pasteBlocked && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          🚫 Copy-paste is not allowed! Type your code manually.
        </div>
      )}

      {/* Header */}
      <header
        className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b px-6 py-4 flex items-center justify-between`}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">💻 Coding Platform</h1>
          <div className="flex gap-2">
            {["c", "cpp", "python", "java"].map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  language === lang
                    ? "bg-blue-500 text-white"
                    : darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}
          >
            <span className="text-sm font-medium">
              Score: {progress.total_score}
            </span>
            <span className="text-xs ml-2 opacity-70">
              ({progress.solved_count}/{progress.total_questions} solved)
            </span>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left: Plagiarism Panel */}
        <div
          className={`w-64 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-r p-4 overflow-y-auto`}
        >
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            🔍 Plagiarism Check
          </h3>
          {plagiarismMatches.length === 0 ? (
            <div
              className={`p-3 rounded-lg ${darkMode ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-700"}`}
            >
              <p className="text-sm font-medium">✅ No plagiarism detected</p>
              <p className="text-xs mt-1 opacity-70">
                Threshold: 85% similarity
              </p>
            </div>
          ) : (
            <div
              className={`p-3 rounded-lg ${darkMode ? "bg-red-900/30" : "bg-red-50"}`}
            >
              <p className="text-sm font-medium text-red-600">
                ⚠️ {plagiarismMatches.length} match(es) found!
              </p>
              {plagiarismMatches.map((match) => (
                <div
                  key={match.student_id}
                  className="mt-2 p-2 bg-white rounded border"
                >
                  <p className="text-xs font-medium">{match.name}</p>
                  <p className="text-xs text-red-500">
                    {match.similarity}% similar
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Submission History */}
          {submissions.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2 text-sm">📜 History</h3>
              {submissions.slice(0, 5).map((sub, i) => (
                <div
                  key={sub.id}
                  className={`p-2 mb-2 rounded-lg text-xs ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
                >
                  <p>Attempt #{submissions.length - i}</p>
                  <p
                    className={
                      sub.score > 0 ? "text-green-500" : "text-red-500"
                    }
                  >
                    Score: {sub.score || 0}
                  </p>
                  <p className="opacity-70">
                    {new Date(sub.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center: Code Editor */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div
            className={`px-4 py-3 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b flex items-center justify-between`}
          >
            <div>
              {selectedQuestion && (
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {language.toUpperCase()}
                  </span>
                  <h2 className="font-semibold">{selectedQuestion.title}</h2>
                  <span className="text-xs opacity-70">
                    {selectedQuestion.points} pts
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={runCode}
                disabled={isRunning || !selectedQuestion}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
              >
                {isRunning ? "⏳ Running..." : "▶️ Run Code"}
              </button>
              <button
                onClick={submitCode}
                disabled={isSubmitting || !selectedQuestion}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
              >
                {isSubmitting ? "⏳ Submitting..." : "✅ Submit"}
              </button>
            </div>
          </div>

          {/* Anti-Cheat Notice */}
          <div
            className={`px-4 py-2 ${darkMode ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"} border-b text-red-600 text-sm flex items-center gap-2`}
          >
            🚫 <span className="font-medium">Copy-paste is disabled.</span> Type
            your code manually to ensure academic integrity.
          </div>

          {/* Question Info */}
          {selectedQuestion && (
            <div
              className={`px-4 py-3 ${darkMode ? "bg-gray-800/50" : "bg-blue-50"} text-sm`}
            >
              <p className={darkMode ? "text-gray-300" : "text-gray-700"}>
                {selectedQuestion.description}
              </p>
            </div>
          )}

          {/* Monaco Editor - Paste Blocked */}
          <div className="flex-1" onPaste={handlePaste}>
            <Editor
              height="100%"
              language={getLanguageForMonaco()}
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              theme={darkMode ? "vs-dark" : "light"}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                wordWrap: "on",
                folding: true,
                renderLineHighlight: "all",
                matchBrackets: "always",
                // Disable paste-related features
                readOnly: false,
                domReadOnly: false,
              }}
            />
          </div>

          {/* Output Terminal */}
          <div
            className={`h-48 ${darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-900 border-gray-200"} border-t`}
          >
            <div className="px-4 py-2 border-b border-gray-700 flex items-center justify-between">
              <span className="text-green-400 text-sm font-medium flex items-center gap-2">
                ● Output Terminal
              </span>
              {testResults && (
                <span
                  className={`text-sm font-medium ${testResults.success ? "text-green-400" : "text-yellow-400"}`}
                >
                  {testResults.totalPassed}/{testResults.totalTests} passed
                </span>
              )}
            </div>
            <div className="p-4 h-[calc(100%-40px)] overflow-auto">
              {testResults ? (
                <div className="space-y-2">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                    {output}
                  </pre>
                  <div className="mt-3 space-y-1">
                    {testResults.results.map((result, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded text-xs ${result.passed ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}
                      >
                        <span className="font-medium">Test {i + 1}:</span>{" "}
                        {result.passed ? "✅ PASSED" : "❌ FAILED"}
                        {!result.passed && (
                          <div className="mt-1 opacity-80">
                            <div>Expected: {result.expectedOutput}</div>
                            <div>Got: {result.actualOutput}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <pre className="text-gray-400 text-sm font-mono whitespace-pre-wrap">
                  {output || "Run your code to see output here..."}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Right: Question Panel */}
        <div
          className={`w-72 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-l p-4 overflow-y-auto`}
        >
          <h3 className="font-semibold mb-4">📋 Questions</h3>
          <div className="space-y-3">
            {questions.map((q) => (
              <div
                key={q.id}
                onClick={() => handleQuestionSelect(q)}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  selectedQuestion?.id === q.id
                    ? "bg-blue-50 border-2 border-blue-500 shadow-md"
                    : darkMode
                      ? "bg-gray-700 hover:bg-gray-600 border-2 border-transparent"
                      : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-600"}`}
                  >
                    {q.language.toUpperCase()}
                  </span>
                  <span className="text-xs font-medium text-blue-600">
                    {q.points} pts
                  </span>
                </div>
                <h4 className="font-medium text-sm mb-1">{q.title}</h4>
                <p
                  className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} line-clamp-2`}
                >
                  {q.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
