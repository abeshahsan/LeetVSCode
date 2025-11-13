import { useEffect, useMemo, useState } from "react";
import { parseMetaData, parseExampleTestcases } from "../utils/ui.js";
import FunctionSignature from "./parts/FunctionSignature.jsx";
import TestCaseEditor from "./parts/TestCaseEditor.jsx";
import RemoteResults from "./parts/RemoteResults.jsx";

export default function TestRunnerPane({ problem, onSubmit, isSubmitting = false }) {
  const metaData = useMemo(() => parseMetaData(problem), [problem]);
  const paramCount = metaData.params.length;

  const examples = useMemo(
    () => parseExampleTestcases(problem?.exampleTestcases, paramCount),
    [problem?.exampleTestcases, paramCount]
  );

  const [testcases, setTestcases] = useState([]);
  const [remoteRunning, setRemoteRunning] = useState(false);
  const [remoteResults, setRemoteResults] = useState(null);

  useEffect(() => {
    setTestcases(examples.length > 0 ? examples : [new Array(Math.max(1, paramCount)).fill("")]);
    setRemoteResults(null);
  }, [examples, paramCount, problem?.questionId]);

  function addTestcase() {
    setTestcases((prev) => [...prev, new Array(Math.max(1, paramCount)).fill("")]);
  }

  function removeTestcase(idx) {
    setTestcases((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateTestcaseParam(caseIdx, paramIdx, value) {
    setTestcases((prev) =>
      prev.map((testCase, i) =>
        i === caseIdx ? testCase.map((param, j) => (j === paramIdx ? value : param)) : testCase
      )
    );
  }

  async function runRemote() {
    if (testcases.length === 0) return;
    const formattedInput = testcases.map((testCase) => testCase.join("\n")).join("\n");
    const selected = window.__SELECTED_LANG__ || "cpp";
    setRemoteRunning(true);
    setRemoteResults(null);
    window.vscode.postMessage({
      command: "run-remote",
      slug: problem?.titleSlug,
      langSlug: selected,
      input: formattedInput,
    });
  }

  useEffect(() => {
    function handler(e) {
      const msg = e.detail || e.data;
      if (!msg || !msg.command) return;
      switch (msg.command) {
        case "runResponse":
          setRemoteResults({ type: "response", data: msg.data });
          setRemoteRunning(false);
          break;
        case "runError":
          setRemoteResults({ type: "error", error: msg.error });
          setRemoteRunning(false);
          break;
        default:
          break;
      }
    }
    window.addEventListener("vscode-message", handler);
    return () => window.removeEventListener("vscode-message", handler);
  }, []);

  return (
    <div className='h-full flex flex-col bg-gradient-to-br from-slate-900/30 to-blue-950/20'>
      <div className='panel-header p-4 bg-gradient-to-r from-slate-900/60 via-purple-900/20 to-slate-900/60 backdrop-blur-sm border-b border-purple-500/20'>
        <div className='flex items-center justify-between mb-3'>
          <h3 className='text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2'>
            <span>🧪</span> Test Cases
          </h3>
          <div className='flex gap-2'>
            <button
              onClick={addTestcase}
              className='px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-slate-700 to-slate-600 hover:from-purple-600 hover:to-pink-600 border border-slate-500/50 hover:border-purple-400/50 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95'
            >
              <span className='text-base font-bold'>+</span>
              Add Case
            </button>
            <button
              onClick={runRemote}
              disabled={!problem || testcases.length === 0 || remoteRunning}
              className='px-5 py-2 text-sm font-bold rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-green-500/40 hover:scale-105 active:scale-95'
            >
              {remoteRunning ? (
                <>
                  <div className='animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full'></div>
                  Running...
                </>
              ) : (
                <>
                  <span>▶</span>
                  Run Code
                </>
              )}
            </button>
            <button
              onClick={onSubmit}
              disabled={!problem || isSubmitting}
              className='px-5 py-2 text-sm font-bold rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-blue-500/40 hover:scale-105 active:scale-95'
            >
              {isSubmitting ? (
                <>
                  <span className='animate-spin'>⏳</span>
                  Submitting...
                </>
              ) : (
                <>
                  <span>📤</span>
                  Submit
                </>
              )}
            </button>
          </div>
        </div>
        <FunctionSignature metaData={metaData} />
      </div>

      <div className='flex-1 overflow-auto p-4'>
        <TestCaseEditor
          testcases={testcases}
          examples={examples}
          metaData={metaData}
          onAdd={addTestcase}
          onRemove={removeTestcase}
          onUpdate={updateTestcaseParam}
        />
      </div>

      {remoteResults && (
        <div className='border-t border-purple-500/20 bg-gradient-to-br from-slate-900/80 via-purple-900/20 to-slate-900/80 backdrop-blur-sm'>
          <div className='p-4'>
            <div className='text-lg font-bold mb-3 flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent'>
              <span className='text-cyan-400'>📊</span> Results
            </div>
            <RemoteResults remoteResults={remoteResults} testcases={testcases} metaData={metaData} />
          </div>
        </div>
      )}
    </div>
  );
}
