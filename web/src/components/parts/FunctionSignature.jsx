import React from "react";

export default function FunctionSignature({ metaData }) {
  if (!metaData || (metaData.params || []).length === 0) return null;
  return (
    <div className='p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-blue-900/20 border border-blue-500/30 shadow-lg'>
      <div className='text-xs text-cyan-400 mb-2 uppercase tracking-wider font-bold flex items-center gap-2'>
        <span>🔧</span> Function Signature
      </div>
      <div className='text-sm font-mono bg-slate-900/70 p-3 rounded-lg border border-slate-700/50 shadow-inner'>
        <span className='text-purple-400 font-bold'>{metaData.functionName}</span>
        <span className='text-cyan-300'>(</span>
        {metaData.params.map((p, i) => (
          <span key={i}>
            <span className='text-emerald-400 font-semibold'>{p.type}</span>
            <span className='text-yellow-300 font-medium'> {p.name}</span>
            {i < metaData.params.length - 1 && <span className='text-cyan-300'>, </span>}
          </span>
        ))}
        <span className='text-cyan-300'>)</span>
      </div>
    </div>
  );
}
