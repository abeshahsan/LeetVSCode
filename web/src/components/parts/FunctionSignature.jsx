import React from "react";

export default function FunctionSignature({ metaData }) {
  if (!metaData || (metaData.params || []).length === 0) return null;
  return (
    <div className='p-3 rounded-lg bg-gray-900/50 border border-gray-700'>
      <div className='text-xs text-gray-400 mb-1 uppercase tracking-wide'>Function Signature</div>
      <div className='text-sm font-mono text-blue-300 bg-gray-800/50 p-2 rounded border'>
        <span className='text-purple-300'>{metaData.functionName}</span>
        <span className='text-gray-300'>(</span>
        {metaData.params.map((p, i) => (
          <span key={i}>
            <span className='text-green-300'>{p.type}</span>
            <span className='text-yellow-300'> {p.name}</span>
            {i < metaData.params.length - 1 && <span className='text-gray-300'>, </span>}
          </span>
        ))}
        <span className='text-gray-300'>)</span>
      </div>
    </div>
  );
}
