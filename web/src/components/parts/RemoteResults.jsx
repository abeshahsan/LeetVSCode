import React from "react";

export default function RemoteResults({ remoteResults, testcases, metaData }) {
  if (!remoteResults) return null;

  if (remoteResults.type === "error") {
    return (
      <div className='p-4 rounded-lg border border-red-600/50 bg-red-900/20'>
        <div className='text-red-300 font-medium mb-2'>❌ Execution Error</div>
        <div className='text-red-200 text-sm'>{remoteResults.error}</div>
      </div>
    );
  }

  if (remoteResults.type === "poll") {
    return (
      <div className='space-y-3'>
        <div className='text-gray-300 font-medium'>🔄 Polling Results</div>
        {remoteResults.polls.map((p, i) => (
          <pre
            key={i}
            className='text-xs text-gray-300 whitespace-pre-wrap p-3 rounded border border-gray-700 bg-gray-800/50 overflow-auto max-h-40'
          >
            {JSON.stringify(p, null, 2)}
          </pre>
        ))}
      </div>
    );
  }

  if (remoteResults.type !== "response") return null;

  const data = remoteResults.data;

  // Compile error
  if (data?.compile_error || data?.full_compile_error || data?.status_msg === "Compile Error") {
    return (
      <div className='p-4 rounded-lg border border-orange-600/50 bg-orange-900/20'>
        <div className='flex items-center gap-2 mb-3'>
          <span className='text-orange-400 text-lg'>🔧</span>
          <div className='text-orange-300 font-semibold'>Compilation Error</div>
        </div>
        <div className='bg-orange-950/50 border border-orange-700/30 rounded-lg p-3'>
          <div className='text-orange-300 font-medium text-sm mb-2'>Error Details:</div>
          <div className='font-mono text-orange-200 text-xs whitespace-pre-wrap'>
            {data.full_compile_error || data.compile_error || "No error details available"}
          </div>
        </div>
      </div>
    );
  }

  // Runtime error
  if (data?.runtime_error || data?.full_runtime_error || data?.status_msg === "Runtime Error") {
    return (
      <div className='p-4 rounded-lg border border-purple-600/50 bg-purple-900/20'>
        <div className='flex items-center gap-2 mb-3'>
          <span className='text-purple-400 text-lg'>⚠️</span>
          <div className='text-purple-300 font-semibold'>Runtime Error</div>
        </div>
        <div className='bg-purple-950/50 border border-purple-700/30 rounded-lg p-3'>
          <div className='text-purple-300 font-medium text-sm mb-2'>Error Details:</div>
          <div className='font-mono text-purple-200 text-xs whitespace-pre-wrap'>
            {data.full_runtime_error || data.runtime_error || "No error details available"}
          </div>
        </div>
      </div>
    );
  }

  // Other errors
  if (data?.run_success === false && data?.status_msg && data?.status_msg !== "Compile Error" && data?.status_msg !== "Runtime Error") {
    return (
      <div className='p-4 rounded-lg border border-red-600/50 bg-red-900/20'>
        <div className='flex items-center gap-2 mb-3'>
          <span className='text-red-400 text-lg'>❌</span>
          <div className='text-red-300 font-semibold'>{data.status_msg}</div>
        </div>
        {data.error_message && (
          <div className='bg-red-950/50 border border-red-700/30 rounded-lg p-3'>
            <div className='text-red-300 font-medium text-sm mb-2'>Error Details:</div>
            <div className='font-mono text-red-200 text-xs whitespace-pre-wrap'>{data.error_message}</div>
          </div>
        )}
      </div>
    );
  }

  // Debug info on failed runs
  if (data?.run_success === false || data?.status_msg === "Compile Error" || data?.status_msg === "Runtime Error") {
    return (
      <div className='space-y-4'>
        <div className='p-4 rounded-lg border border-gray-600/50 bg-gray-900/20'>
          <div className='flex items-center gap-2 mb-3'>
            <span className='text-gray-400 text-lg'>🐛</span>
            <div className='text-gray-300 font-semibold'>Debug Info</div>
          </div>
          <div className='bg-gray-950/50 border border-gray-700/30 rounded-lg p-3'>
            <div className='text-gray-300 font-medium text-sm mb-2'>Raw Response Data:</div>
            <pre className='font-mono text-gray-200 text-xs whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto'>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  // Happy path: compare outputs
  if (data?.code_answer && data?.expected_code_answer && data?.compare_result) {
    const outputs = data.code_answer.slice(0, -1) || [];
    const expected = data.expected_code_answer;
    const compareResult = data.compare_result;
    const totalCorrect = data.total_correct || 0;
    const totalCases = data.total_testcases || outputs.length;
    const allPassed = totalCorrect === totalCases;

    return (
      <div className='space-y-4'>
        <div className={`p-4 rounded-lg border ${allPassed ? "bg-green-900/20 border-green-700/50" : "bg-red-900/20 border-red-700/50"}`}>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center gap-2'>
              <span className={`text-lg ${allPassed ? "text-green-400" : "text-red-400"}`}>
                {allPassed ? "✅" : "❌"}
              </span>
              <span className={`font-semibold ${allPassed ? "text-green-300" : "text-red-300"}`}>
                {allPassed ? "All Tests Passed!" : "Some Tests Failed"}
              </span>
            </div>
            <span className={`text-sm font-mono px-2 py-1 rounded ${allPassed ? "bg-green-800/50 text-green-200" : "bg-red-800/50 text-red-200"}`}>
              {totalCorrect}/{totalCases} passed
            </span>
          </div>
          <div className='flex items-center gap-6 text-sm text-gray-400'>
            <div className='flex items-center gap-1'>
              <span>⚡</span>
              <span>{data.status_runtime || "0 ms"}</span>
            </div>
            <div className='flex items-center gap-1'>
              <span>💾</span>
              <span>{data.status_memory || "0 MB"}</span>
            </div>
            <div className='flex items-center gap-1'>
              <span>🔤</span>
              <span>{data.pretty_lang || data.lang}</span>
            </div>
          </div>
        </div>

        <div className='space-y-3'>
          {outputs.map((output, i) => {
            const passed = compareResult[i] === "1";
            const exp = expected[i] || "";
            const out = output || "";

            return (
              <div key={i} className={`border rounded-lg ${passed ? "border-green-700/50 bg-green-900/10" : "border-red-700/50 bg-red-900/10"}`}>
                <div className='flex items-center justify-between p-3 border-b border-gray-700'>
                  <div className='flex items-center gap-2'>
                    <span className={`text-lg ${passed ? "text-green-400" : "text-red-400"}`}>
                      {passed ? "✅" : "❌"}
                    </span>
                    <span className='font-medium text-gray-300'>Test Case {i + 1}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${passed ? "bg-green-800/50 text-green-200 border border-green-700/50" : "bg-red-800/50 text-red-200 border border-red-700/50"}`}>
                    {passed ? "PASSED" : "FAILED"}
                  </span>
                </div>

                <div className='p-3 space-y-3 text-sm'>
                  {testcases[i] && (
                    <div>
                      <div className='text-gray-400 text-xs uppercase tracking-wide mb-2'>Input</div>
                      <div className='space-y-1'>
                        {testcases[i].map((param, paramIdx) => (
                          <div key={paramIdx} className='flex items-start gap-2'>
                            <span className='text-blue-300 font-medium min-w-0'>
                              {metaData.params[paramIdx]?.name || `param${paramIdx + 1}`}:
                            </span>
                            <span className='text-gray-300 font-mono text-xs bg-gray-800/50 px-2 py-1 rounded flex-1'>
                              {param}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <div className='text-gray-400 text-xs uppercase tracking-wide mb-1'>Expected</div>
                      <div className='font-mono text-xs bg-gray-800/50 p-2 rounded text-gray-300 break-all'>
                        {exp}
                      </div>
                    </div>
                    <div>
                      <div className='text-gray-400 text-xs uppercase tracking-wide mb-1'>Output</div>
                      <div className={`font-mono text-xs p-2 rounded break-all ${passed ? "bg-green-900/20 text-green-300 border border-green-700/30" : "bg-red-900/20 text-red-300 border border-red-700/30"}`}>
                        {out}
                      </div>
                    </div>
                  </div>

                  {data.std_output_list && data.std_output_list[i] && (
                    <div className='mt-3'>
                      <div className='text-gray-400 text-xs uppercase tracking-wide mb-1'>Standard Output</div>
                      <div className='font-mono text-xs bg-blue-900/10 border border-blue-600/30 p-2 rounded text-blue-300 break-all whitespace-pre-wrap'>
                        {data.std_output_list[i] || "(empty)"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Fallback for unexpected response format
  return (
    <div className='p-4 rounded-lg border border-orange-600/50 bg-orange-900/20'>
      <div className='text-orange-300 font-medium mb-2'>⚠️ Unexpected Response Format</div>
      <pre className='text-xs text-gray-300 whitespace-pre-wrap p-3 rounded bg-gray-800/50 border border-gray-700 overflow-auto max-h-40'>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
