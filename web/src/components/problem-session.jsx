import { useEffect, useMemo, useRef, useState } from "react";
import ProblemPane from "./problem-pane";
import TestRunnerPane from "./test-runner-pane";

export default function ProblemSession({ data, onBack }) {
  const problem = data?.question;
  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const [topHeight, setTopHeight] = useState(null); // px
  const codeSnippets = useMemo(() => problem?.codeSnippets || [], [problem?.codeSnippets]);
  const defaultLang = useMemo(() => {
    // Prefer javascript, then python3, else first
    const pref = ["javascript", "python3", "typescript", "java"];
    for (const p of pref) {
      const found = codeSnippets.find((c) => c.langSlug === p);
      if (found) return found.langSlug;
    }
    return codeSnippets[0]?.langSlug;
  }, [codeSnippets]);
  const [langSlug, setLangSlug] = useState(defaultLang);

  // Open or create the solution file in VS Code (column two) for the current language
  function openSolutionFile(currentLang) {
    const slug = problem?.titleSlug;
    const snippet = codeSnippets.find((c) => c.langSlug === currentLang);
    if (!slug || !snippet) return;
    try {
      window.vscode?.postMessage({
        command: "open-solution-file",
        slug,
        langSlug: currentLang,
        code: snippet.code,
      });
    } catch (e) {
      // ignore
      console.warn("Failed to post open-solution-file message", e);
    }
  }

  // Initialize selection and open the file when problem changes
  useEffect(() => {
    setLangSlug(defaultLang);
    if (defaultLang) openSolutionFile(defaultLang);
    // expose selected language to other components in the webview
    try {
      window.__SELECTED_LANG__ = defaultLang;
    } catch (e) {
      console.warn("Could not set __SELECTED_LANG__", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.titleSlug, defaultLang]);

  useEffect(() => {
    // Initialize to 60% height on first render
    const el = containerRef.current;
    if (el && topHeight === null) {
      setTopHeight(Math.floor(el.clientHeight * 0.6));
    }
  }, [topHeight]);

  useEffect(() => {
    function onMove(e) {
      if (!draggingRef.current) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const y = e.clientY || (e.touches && e.touches[0]?.clientY);
      let newTop = Math.max(80, Math.min(rect.height - 80, y - rect.top));
      setTopHeight(newTop);
    }

    function onUp() {
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  function startDrag(e) {
    draggingRef.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-[#0d1117] text-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#0f1419] shadow-lg">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="text-sm px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-600 transition-colors flex items-center gap-2"
            >
              ← Back
            </button>
          )}
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">
              {problem?.questionFrontendId ? `${problem.questionFrontendId}. ` : ""}
              {problem?.title || "Problem"}
            </h2>
            {problem?.difficulty && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                problem.difficulty?.toLowerCase() === 'easy' 
                  ? 'text-green-500 bg-green-500/10 border-green-500/20'
                  : problem.difficulty?.toLowerCase() === 'medium'
                  ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
                  : 'text-red-500 bg-red-500/10 border-red-500/20'
              }`}>
                {problem.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-3">
          {codeSnippets.length > 0 && (
            <>
              <label className="text-sm text-gray-400 font-medium">Language:</label>
              <select
                className="bg-[#161b22] border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 min-w-[120px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors"
                value={langSlug || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setLangSlug(val);
                  openSolutionFile(val);
                  try {
                    window.__SELECTED_LANG__ = val;
                  } catch (e) {
                    console.warn("Could not set __SELECTED_LANG__", e);
                  }
                }}
              >
                {codeSnippets.map((c) => (
                  <option key={c.langSlug} value={c.langSlug}>
                    {c.lang}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Top pane: problem */}
      <div style={{ height: topHeight ? `${topHeight}px` : "60%" }} className="overflow-hidden">
        <ProblemPane problem={problem} />
      </div>

      {/* Splitter */}
      <div
        role="separator"
        aria-orientation="horizontal"
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        className="h-2 bg-gray-800 hover:bg-gray-700 cursor-row-resize border-y border-gray-700 flex items-center justify-center group"
      >
        <div className="w-8 h-0.5 bg-gray-600 group-hover:bg-gray-500 transition-colors"></div>
      </div>

      {/* Bottom pane: test runner */}
      <div className="flex-1 overflow-hidden">
        <TestRunnerPane problem={problem} />
      </div>
    </div>
  );
}
