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
    <div ref={containerRef} className="h-full flex flex-col bg-[#1e1e1e] text-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="text-sm px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
            >
              ← Back
            </button>
          )}
          <h2 className="text-lg font-semibold text-white">
            {problem?.questionFrontendId ? `${problem.questionFrontendId}. ` : ""}
            {problem?.title || "Problem"}
          </h2>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2">
          {codeSnippets.length > 0 && (
            <>
              <label className="text-sm text-gray-400">Language:</label>
              <select
                className="bg-[#161616] border border-gray-700 text-gray-200 text-sm rounded px-2 py-1"
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
      <div style={{ height: topHeight ? `${topHeight}px` : "60%" }} className="overflow-auto p-4">
        <ProblemPane problem={problem} />
      </div>

      {/* Splitter */}
      <div
        role="separator"
        aria-orientation="horizontal"
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        className="h-2 bg-gray-800 hover:bg-gray-700 cursor-row-resize"
      />

      {/* Bottom pane: test runner */}
      <div className="flex-1 overflow-auto p-4 border-t border-gray-700">
        <TestRunnerPane problem={problem} />
      </div>
    </div>
  );
}
