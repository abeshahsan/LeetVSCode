import React from "react";

export default function TestCaseEditor({ testcases, examples = [], metaData, onAdd, onRemove, onUpdate }) {
	const hasParams = (metaData?.params || []).length > 0;

	return (
		<>
			<div className='flex items-center justify-between mb-4'>
				<div className='text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'>
					Test Cases {hasParams && `(${metaData.params.length} parameters)`}
				</div>
				<div className='text-xs px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 font-semibold'>
					{testcases.length} case{testcases.length !== 1 ? 's' : ''}
				</div>
			</div>

			{testcases.length === 0 ? (
				<div className='text-center py-10 rounded-xl bg-gradient-to-br from-slate-800/30 to-purple-900/10 border border-slate-700/50'>
					<div className='text-5xl mb-3'>📝</div>
					<div className='text-sm font-semibold text-purple-300 mb-1'>No test cases yet</div>
					<div className='text-xs text-purple-400/70'>Click "Add Case" to get started</div>
				</div>
			) : (
				<div className='space-y-3'>
					{testcases.map((testCase, caseIdx) => (
						<div
							key={caseIdx}
							className='rounded-xl bg-gradient-to-br from-slate-800/40 to-blue-900/10 border border-blue-500/20 transition-all duration-300 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/10'
						>
							<div className='flex items-center justify-between p-4 border-b border-blue-500/20 bg-gradient-to-r from-slate-800/50 to-transparent'>
								<div className='flex items-center gap-3'>
									<span className='text-sm font-bold text-cyan-400'>Case {caseIdx + 1}</span>
									{caseIdx < examples.length && (
										<span className='text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/40 text-emerald-300 font-semibold'>
											✨ Example
										</span>
									)}
								</div>
								<button
									onClick={() => onRemove(caseIdx)}
									className='px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-400/50 text-red-400 hover:text-red-300 transition-all duration-200'
								>
									✕ Remove
								</button>
							</div>

							<div className='p-4 space-y-3'>
								{testCase.map((param, paramIdx) => (
									<div key={paramIdx}>
										{metaData.params[paramIdx] && (
											<label className='block text-xs font-bold text-purple-400 mb-2 uppercase tracking-wider'>
												{metaData.params[paramIdx].name}
												<span className='text-purple-400/70 ml-2 font-normal'>
													({metaData.params[paramIdx].type})
												</span>
											</label>
										)}
										<textarea
											value={param}
											onChange={(e) => onUpdate(caseIdx, paramIdx, e.target.value)}
											placeholder={`Enter ${
												metaData.params[paramIdx]?.name || `parameter ${paramIdx + 1}`
											}...`}
											spellCheck={false}
											className='w-full h-16 p-3 font-mono text-sm rounded-lg resize-none focus:outline-none bg-slate-900/70 border border-slate-700/50 text-cyan-100 placeholder-slate-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200'
										/>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			)}

			<div className='mt-4'>
				<button
					onClick={onAdd}
					className='px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95'
				>
					<span className='text-base font-bold'>+</span>
					Add Case
				</button>
			</div>
		</>
	);
}
