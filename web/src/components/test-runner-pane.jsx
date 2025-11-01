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
    <div className='h-full flex flex-col bg-[#0a0a0a]'>
      <div className='border-b border-gray-800 p-4 bg-[#1a1a1a]'>
        <div className='flex items-center justify-between mb-3'>
          <h3 className='text-lg font-semibold text-white'>🧪 Test Cases</h3>
          <div className='flex gap-2'>
            <button
              onClick={addTestcase}
              className='px-3 py-1.5 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 transition-colors flex items-center gap-1'
            >
              <span className='text-xs'>+</span>
              Add Case
            </button>
            <button
              onClick={runRemote}
              disabled={!problem || testcases.length === 0 || remoteRunning}
              className='px-4 py-1.5 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-2'
            >
              {remoteRunning ? (
                <>
                  <div className='animate-spin h-3 w-3 border border-white border-t-transparent rounded-full'></div>
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
              className='px-4 py-1.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-2'
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
        <div className='border-t border-gray-800 bg-[#1a1a1a]'>
          <div className='p-4'>
            <div className='text-lg font-semibold text-white mb-3 flex items-center gap-2'>📊 Results</div>
            <RemoteResults remoteResults={remoteResults} testcases={testcases} metaData={metaData} />
          </div>
        </div>
      )}
    </div>
  );
}
