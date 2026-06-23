import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import api from "../../services/api";

const StudentPortal = () => {
  const [language, setLanguage] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [plagiarismMatches, setPlagiarismMatches] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [pasteWarning, setPasteWarning] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    if (language) {
      fetchQuestions();
    }
  }, [language]);

  const fetchQuestions = async () => {
    try {
      const res = await api.get(`/student/questions/${language}`);
      setQuestions(res.data);
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    }
  };

  const handleQuestionSelect = async (question) => {
    setSelectedQuestion(question);
    const starterCode = question.starter_code || "";
    setCode(starterCode);
    setOutput("");
    setPlagiarismMatches([]);

    if (starterCode) {
      setTimeout(() => {
        handleCompile(starterCode);
      }, 500);
    }
  };

  const handleCompile = async (codeToCompile = code) => {
    if (!codeToCompile.trim()) {
      setOutput("Error: No code to compile");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/student/compile", {
        code: codeToCompile,
        language,
      });
      setOutput(
        res.data.success ? res.data.output : `Error:\n${res.data.output}`,
      );
    } catch (err) {
      setOutput("Compilation failed. Please try again.");
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedQuestion) {
      alert("Please select a question first");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/student/submit", {
        question_id: selectedQuestion.id,
        code,
        language,
      });

      alert("✅ Code submitted successfully!");
      fetchPlagiarism(selectedQuestion.id);
    } catch (err) {
      alert(
        "❌ Failed to submit: " +
          (err.response?.data?.error || "Unknown error"),
      );
    }
    setSubmitting(false);
  };

  const fetchPlagiarism = async (questionId) => {
    try {
      const res = await api.get(`/student/plagiarism/${questionId}`);
      setPlagiarismMatches(res.data);
    } catch (err) {
      console.error("Plagiarism check failed:", err);
    }
  };

  // ANTI-PASTE: Setup editor with paste blocking
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    const domNode = editor.getDomNode();
    if (!domNode) return;

    // Block Ctrl+V / Cmd+V
    const preventKeyPaste = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        e.stopPropagation();
        triggerPasteWarning();
        return false;
      }
    };

    // Block right-click context menu
    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Block browser paste event
    const preventBrowserPaste = (e) => {
      e.preventDefault();
      triggerPasteWarning();
      return false;
    };

    domNode.addEventListener("keydown", preventKeyPaste, true);
    domNode.addEventListener("contextmenu", preventContextMenu, true);
    domNode.addEventListener("paste", preventBrowserPaste, true);

    // Also intercept Monaco's paste command
    editor.onDidPaste(() => {
      const currentValue = editor.getValue();
      // If paste happened, we can't easily revert, but we warn the user
      triggerPasteWarning();
    });
  };

  const triggerPasteWarning = () => {
    setPasteWarning(true);
    setTimeout(() => setPasteWarning(false), 3000);
  };

  if (!language) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">&lt;/&gt;</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">
              Welcome, Student!
            </h2>
            <p className="text-gray-500 mt-2">
              Choose your programming language to begin
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setLanguage("c")}
              className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-bold hover:bg-blue-700 transition-all hover:scale-105 shadow-lg flex flex-col items-center gap-2"
            >
              <span className="text-2xl">C</span>
              <span className="text-sm font-normal">Programming</span>
            </button>
            <button
              onClick={() => setLanguage("cpp")}
              className="px-8 py-4 bg-purple-600 text-white rounded-xl text-lg font-bold hover:bg-purple-700 transition-all hover:scale-105 shadow-lg flex flex-col items-center gap-2"
            >
              <span className="text-2xl">C++</span>
              <span className="text-sm font-normal">Programming</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left: Plagiarism Panel */}
      <div className="w-72 bg-white border-r overflow-y-auto p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🔍</span>
          <h2 className="text-lg font-bold text-gray-800">Plagiarism Check</h2>
        </div>
        {plagiarismMatches.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <span className="text-3xl mb-2 block">✅</span>
            <p className="text-sm text-green-700 font-medium">
              No plagiarism detected
            </p>
            <p className="text-xs text-green-600 mt-1">
              Threshold: 85% similarity
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-red-700 font-bold">
                ⚠️ {plagiarismMatches.length} match(es) found!
              </p>
            </div>
            {plagiarismMatches.map((match) => (
              <div
                key={match.student_id}
                className="bg-red-50 border border-red-200 p-3 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <p className="font-medium text-sm text-gray-800">
                    {match.name}
                  </p>
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    {match.similarity}%
                  </span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  Similar code detected
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Center: Code Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setLanguage(null);
                setSelectedQuestion(null);
                setCode("");
                setOutput("");
              }}
              className="text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1 transition-colors"
            >
              ← Back
            </button>
            {selectedQuestion && (
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                  {language.toUpperCase()}
                </span>
                <span className="font-medium text-gray-800">
                  {selectedQuestion.title}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {pasteWarning && (
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium animate-pulse flex items-center gap-1">
                ⚠️ Paste blocked!
              </span>
            )}
            <button
              onClick={() => handleCompile()}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center gap-2 transition-colors"
            >
              {loading ? "⏳ Running..." : "▶ Run Code"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedQuestion}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2 transition-colors"
            >
              {submitting ? "📤 Submitting..." : "📤 Submit"}
            </button>
          </div>
        </div>

        {/* Question Info */}
        {selectedQuestion && (
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
            <p className="text-sm text-blue-800">
              {selectedQuestion.description}
            </p>
          </div>
        )}

        {/* Monaco Editor */}
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={language === "c" ? "c" : "cpp"}
            value={code}
            onChange={setCode}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              roundedSelection: false,
              readOnly: false,
              domReadOnly: false,
            }}
          />
        </div>

        {/* Output Terminal */}
        <div className="bg-gray-900 text-green-400 p-4 font-mono text-sm h-48 overflow-auto border-t border-gray-700">
          <div className="flex items-center gap-2 mb-2 text-gray-500 text-xs uppercase tracking-wider">
            <span>●</span>
            <span>Output Terminal</span>
          </div>
          {output ? (
            <pre className="whitespace-pre-wrap">{output}</pre>
          ) : (
            <div className="text-gray-600 italic">
              Run your code to see output here...
            </div>
          )}
        </div>
      </div>

      {/* Right: Question Panel */}
      <div className="w-80 bg-white border-l overflow-y-auto p-4 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
          <span>📋</span> Questions
        </h2>
        <div className="space-y-2">
          {questions.map((q) => (
            <div
              key={q.id}
              onClick={() => handleQuestionSelect(q)}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                selectedQuestion?.id === q.id
                  ? "bg-blue-50 border-2 border-blue-500 shadow-md"
                  : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    q.language === "c"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {q.language.toUpperCase()}
                </span>
              </div>
              <h3 className="font-medium text-sm text-gray-800">{q.title}</h3>
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
