import React from "react";

export default function RemoteResults({ remoteResults, testcases, metaData }) {
	if (!remoteResults) return null;

	if (remoteResults.type === "error") {
		return (
			<div className='p-5 rounded-xl bg-gradient-to-br from-red-900/30 to-pink-900/30 border border-red-500/50 shadow-xl'>
				<div className='flex items-center gap-3 mb-3'>
					<span className='text-2xl'>❌</span>
					<div className='text-red-300 font-bold text-lg'>Execution Error</div>
				</div>
				<div className='text-sm text-red-200 bg-red-950/50 p-3 rounded-lg border border-red-700/30'>{remoteResults.error}</div>
			</div>
		);
	}

	if (remoteResults.type === "poll") {
		return (
			<div className='space-y-3'>
				<div className='font-medium'>🔄 Polling Results</div>
				{remoteResults.polls.map((p, i) => (
					<pre
						key={i}
						className='text-xs whitespace-pre-wrap p-3 rounded code-surface overflow-auto max-h-40'
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
			<div className='p-5 rounded-xl bg-gradient-to-br from-orange-900/30 to-red-900/30 border border-orange-500/50 shadow-xl'>
				<div className='flex items-center gap-3 mb-4'>
					<span className='text-3xl'>🔧</span>
					<div className='text-orange-300 font-bold text-lg'>Compilation Error</div>
				</div>
				<div className='rounded-lg p-4 bg-orange-950/50 border border-orange-700/30'>
					<div className='text-orange-400 font-semibold text-sm mb-2'>Error Details:</div>
					<div className='font-mono text-xs text-orange-200 whitespace-pre-wrap'>
						{data.full_compile_error || data.compile_error || "No error details available"}
					</div>
				</div>
			</div>
		);
	}

	// Runtime error
	if (data?.runtime_error || data?.full_runtime_error || data?.status_msg === "Runtime Error") {
		return (
			<div className='p-5 rounded-xl bg-gradient-to-br from-purple-900/30 to-red-900/30 border border-purple-500/50 shadow-xl'>
				<div className='flex items-center gap-3 mb-4'>
					<span className='text-3xl'>⚠️</span>
					<div className='text-purple-300 font-bold text-lg'>Runtime Error</div>
				</div>
				<div className='rounded-lg p-4 bg-purple-950/50 border border-purple-700/30'>
					<div className='text-purple-400 font-semibold text-sm mb-2'>Error Details:</div>
					<div className='font-mono text-xs text-purple-200 whitespace-pre-wrap'>
						{data.full_runtime_error || data.runtime_error || "No error details available"}
					</div>
				</div>
			</div>
		);
	}

	// Other errors
	if (
		data?.run_success === false &&
		data?.status_msg &&
		data?.status_msg !== "Compile Error" &&
		data?.status_msg !== "Runtime Error"
	) {
		return (
			<div className='p-4 rounded-lg panel status-danger'>
				<div className='flex items-center gap-2 mb-3'>
					<span className='text-danger text-lg'>❌</span>
					<div className='text-danger font-semibold'>{data.status_msg}</div>
				</div>
				{data.error_message && (
					<div className='rounded-lg p-3 code-surface'>
						<div className='text-danger font-medium text-sm mb-2'>Error Details:</div>
						<div className='font-mono text-xs whitespace-pre-wrap'>{data.error_message}</div>
					</div>
				)}
			</div>
		);
	}

	// Debug info on failed runs
	if (data?.run_success === false || data?.status_msg === "Compile Error" || data?.status_msg === "Runtime Error") {
		return (
			<div className='space-y-4'>
				<div className='p-4 rounded-lg panel'>
					<div className='flex items-center gap-2 mb-3'>
						<span className='text-muted text-lg'>🐛</span>
						<div className='font-semibold'>Debug Info</div>
					</div>
					<div className='rounded-lg p-3 code-surface'>
						<div className='font-medium text-sm mb-2'>Raw Response Data:</div>
						<pre className='font-mono text-xs whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto'>
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
				<div className={`p-5 rounded-xl shadow-xl ${
					allPassed 
						? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/50' 
						: 'bg-gradient-to-br from-red-900/30 to-pink-900/30 border border-red-500/50'
				}`}>
					<div className='flex items-center justify-between mb-4'>
						<div className='flex items-center gap-3'>
							<span className={`text-3xl ${
								allPassed ? '' : ''
							}`}>
								{allPassed ? '✅' : '❌'}
							</span>
							<span className={`font-bold text-lg ${
								allPassed ? 'text-green-300' : 'text-red-300'
							}`}>
								{allPassed ? 'All Tests Passed!' : 'Some Tests Failed'}
							</span>
						</div>
						<span className={`text-sm font-mono px-3 py-1.5 rounded-lg font-bold shadow-lg ${
							allPassed 
								? 'bg-green-500/20 border border-green-400/50 text-green-300' 
								: 'bg-red-500/20 border border-red-400/50 text-red-300'
						}`}>
							{totalCorrect}/{totalCases} passed
						</span>
					</div>
					<div className='flex items-center gap-6 text-sm'>
						<div className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30'>
							<span className='text-cyan-400'>⚡</span>
							<span className='text-cyan-300 font-semibold'>{data.status_runtime || '0 ms'}</span>
						</div>
						<div className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30'>
							<span className='text-purple-400'>💾</span>
							<span className='text-purple-300 font-semibold'>{data.status_memory || '0 MB'}</span>
						</div>
						<div className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30'>
							<span className='text-blue-400'>🔤</span>
							<span className='text-blue-300 font-semibold'>{data.pretty_lang || data.lang}</span>
						</div>
					</div>
				</div>

				<div className='space-y-3'>
					{outputs.map((output, i) => {
						const passed = compareResult[i] === '1';
						const exp = expected[i] || '';
						const out = output || '';

						return (
							<div key={i} className={`rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.01] ${
								passed 
									? 'bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/40' 
									: 'bg-gradient-to-br from-red-900/20 to-pink-900/20 border border-red-500/40'
							}`}>
								<div className='flex items-center justify-between p-4 border-b border-opacity-20'>
									<div className='flex items-center gap-3'>
										<span className={`text-2xl`}>
											{passed ? '✅' : '❌'}
										</span>
										<span className={`font-bold ${
											passed ? 'text-green-300' : 'text-red-300'
										}`}>Test Case {i + 1}</span>
									</div>
									<span className={`text-xs px-3 py-1.5 rounded-full font-bold shadow-md ${
										passed 
											? 'bg-green-500/20 border border-green-400/50 text-green-300' 
											: 'bg-red-500/20 border border-red-400/50 text-red-300'
									}`}>
										{passed ? 'PASSED' : 'FAILED'}
									</span>
								</div>

								<div className='p-4 space-y-4 text-sm'>
									{testcases[i] && (
										<div>
											<div className='text-cyan-400 text-xs uppercase tracking-wider mb-2 font-bold flex items-center gap-2'>
												<span>📥</span> Input
											</div>
											<div className='space-y-2'>
												{testcases[i].map((param, paramIdx) => (
													<div key={paramIdx} className='flex items-start gap-2'>
														<span className='text-purple-400 font-bold min-w-0 text-xs'>
															{metaData.params[paramIdx]?.name || `param${paramIdx + 1}`}:
														</span>
														<span className='font-mono text-xs px-2 py-1 rounded flex-1 bg-slate-900/70 border border-slate-700/50 text-cyan-200'>
															{param}
														</span>
													</div>
												))}
											</div>
										</div>
									)}

									<div className='grid grid-cols-2 gap-3'>
										<div>
											<div className='text-green-400 text-xs uppercase tracking-wider mb-2 font-bold flex items-center gap-2'>
												<span>✅</span> Expected
											</div>
											<div className='font-mono text-xs p-3 rounded-lg break-all bg-green-900/20 border border-green-500/30 text-green-200'>
												{exp}
											</div>
										</div>
										<div>
											<div className={`text-xs uppercase tracking-wider mb-2 font-bold flex items-center gap-2 ${
												passed ? 'text-green-400' : 'text-red-400'
											}`}>
												<span>{passed ? '✅' : '❌'}</span> Output
											</div>
											<div className={`font-mono text-xs p-3 rounded-lg break-all ${
												passed 
													? 'bg-green-900/20 border border-green-500/30 text-green-200' 
													: 'bg-red-900/20 border border-red-500/30 text-red-200'
											}`}>
												{out}
											</div>
										</div>
									</div>

									{data.std_output_list && data.std_output_list[i] && (
										<div className='mt-3'>
											<div className='text-blue-400 text-xs uppercase tracking-wider mb-2 font-bold flex items-center gap-2'>
												<span>📝</span> Standard Output
											</div>
											<div className='font-mono text-xs p-3 rounded-lg break-all whitespace-pre-wrap bg-blue-900/20 border border-blue-500/30 text-blue-200'>
												{data.std_output_list[i] || '(empty)'}
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
		<div className='p-4 rounded-lg panel status-warning'>
			<div className='text-warning font-medium mb-2'>⚠️ Unexpected Response Format</div>
			<pre className='text-xs whitespace-pre-wrap p-3 rounded code-surface overflow-auto max-h-40'>
				{JSON.stringify(data, null, 2)}
			</pre>
		</div>
	);
}
