import React from "react";

export default function TestCaseEditor({
  testcases,
  examples = [],
  metaData,
  onAdd,
  onRemove,
  onUpdate,
}) {
  const hasParams = (metaData?.params || []).length > 0;

  return (
    <>
      <div className='flex items-center justify-between mb-4'>
        <div className='text-sm font-medium text-gray-300'>
          Test Cases {hasParams && `(${metaData.params.length} parameters)`}
        </div>
        <div className='text-xs text-gray-500'>
          {testcases.length} case{testcases.length !== 1 ? "s" : ""}
        </div>
      </div>

      {testcases.length === 0 ? (
        <div className='text-center py-8 text-gray-500'>
          <div className='text-4xl mb-2'>📝</div>
          <div className='text-sm'>No test cases yet</div>
          <div className='text-xs text-gray-600 mt-1'>Click "Add Case" to get started</div>
        </div>
      ) : (
        <div className='space-y-3'>
          {testcases.map((testCase, caseIdx) => (
            <div
              key={caseIdx}
              className='border border-gray-700 rounded-lg bg-[#151515] hover:border-gray-600 transition-colors'
            >
              <div className='flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/30'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium text-gray-300'>Case {caseIdx + 1}</span>
                  {caseIdx < examples.length && (
                    <span className='text-xs px-2 py-0.5 bg-blue-600/20 text-blue-300 rounded border border-blue-600/30'>
                      Example
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onRemove(caseIdx)}
                  className='px-2 py-1 text-xs rounded bg-red-800/50 hover:bg-red-700 text-red-200 border border-red-700/50 transition-colors'
                >
                  ✕ Remove
                </button>
              </div>

              <div className='p-3 space-y-3'>
                {testCase.map((param, paramIdx) => (
                  <div key={paramIdx}>
                    {metaData.params[paramIdx] && (
                      <label className='block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide'>
                        {metaData.params[paramIdx].name}
                        <span className='text-gray-500 ml-1'>({metaData.params[paramIdx].type})</span>
                      </label>
                    )}
                    <textarea
                      value={param}
                      onChange={(e) => onUpdate(caseIdx, paramIdx, e.target.value)}
                      placeholder={`Enter ${metaData.params[paramIdx]?.name || `parameter ${paramIdx + 1}`}...`}
                      spellCheck={false}
                      className='w-full h-16 p-3 font-mono text-sm bg-[#0a0a0a] border border-gray-700 rounded-lg text-gray-200 resize-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors'
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className='mt-3'>
        <button
          onClick={onAdd}
          className='px-3 py-1.5 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 transition-colors flex items-center gap-1'
        >
          <span className='text-xs'>+</span>
          Add Case
        </button>
      </div>
    </>
  );
}
