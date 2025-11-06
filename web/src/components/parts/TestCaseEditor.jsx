import React from "react";

export default function TestCaseEditor({ testcases, examples = [], metaData, onAdd, onRemove, onUpdate }) {
	const hasParams = (metaData?.params || []).length > 0;

	return (
		<>
			<div className='flex items-center justify-between mb-4'>
				<div className='text-sm font-medium'>
					Test Cases {hasParams && `(${metaData.params.length} parameters)`}
				</div>
				<div className='text-xs text-muted'>
					{testcases.length} case{testcases.length !== 1 ? "s" : ""}
				</div>
			</div>

			{testcases.length === 0 ? (
				<div className='text-center py-8 text-muted'>
					<div className='text-4xl mb-2'>📝</div>
					<div className='text-sm'>No test cases yet</div>
					<div className='text-xs text-muted mt-1'>Click "Add Case" to get started</div>
				</div>
			) : (
				<div className='space-y-3'>
					{testcases.map((testCase, caseIdx) => (
						<div
							key={caseIdx}
							className='rounded-lg panel transition-colors'
						>
							<div className='flex items-center justify-between p-3 border-b border-panel'>
								<div className='flex items-center gap-2'>
									<span className='text-sm font-medium'>Case {caseIdx + 1}</span>
									{caseIdx < examples.length && (
										<span className='text-xs px-2 py-0.5 rounded chip chip-info'>
											Example
										</span>
									)}
								</div>
								<button
									onClick={() => onRemove(caseIdx)}
									className='px-2 py-1 text-xs rounded btn-outline text-danger transition-colors'
								>
									✕ Remove
								</button>
							</div>

							<div className='p-3 space-y-3'>
								{testCase.map((param, paramIdx) => (
									<div key={paramIdx}>
										{metaData.params[paramIdx] && (
											<label className='block text-xs font-medium text-muted mb-1.5 uppercase tracking-wide'>
												{metaData.params[paramIdx].name}
												<span className='text-muted ml-1'>
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
											className='w-full h-16 p-3 font-mono text-sm rounded-lg resize-none focus:outline-none code-surface'
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
					className='px-3 py-1.5 text-sm rounded-lg btn-outline transition-colors flex items-center gap-1'
				>
					<span className='text-xs'>+</span>
					Add Case
				</button>
			</div>
		</>
	);
}
