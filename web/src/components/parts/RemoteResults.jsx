import React from "react";

export default function RemoteResults({ remoteResults, testcases, metaData }) {
	if (!remoteResults) return null;

	if (remoteResults.type === "error") {
		return (
			<div className='p-4 rounded-lg panel status-danger'>
				<div className='text-danger font-medium mb-2'>❌ Execution Error</div>
				<div className='text-sm'>{remoteResults.error}</div>
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
			<div className='p-4 rounded-lg panel status-warning'>
				<div className='flex items-center gap-2 mb-3'>
					<span className='text-warning text-lg'>🔧</span>
					<div className='text-warning font-semibold'>Compilation Error</div>
				</div>
				<div className='rounded-lg p-3 code-surface'>
					<div className='text-warning font-medium text-sm mb-2'>Error Details:</div>
					<div className='font-mono text-xs whitespace-pre-wrap'>
						{data.full_compile_error || data.compile_error || "No error details available"}
					</div>
				</div>
			</div>
		);
	}

	// Runtime error
	if (data?.runtime_error || data?.full_runtime_error || data?.status_msg === "Runtime Error") {
		return (
			<div className='p-4 rounded-lg panel status-danger'>
				<div className='flex items-center gap-2 mb-3'>
					<span className='text-danger text-lg'>⚠️</span>
					<div className='text-danger font-semibold'>Runtime Error</div>
				</div>
				<div className='rounded-lg p-3 code-surface'>
					<div className='text-danger font-medium text-sm mb-2'>Error Details:</div>
					<div className='font-mono text-xs whitespace-pre-wrap'>
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
				<div className={`p-4 rounded-lg panel ${allPassed ? 'status-success' : 'status-danger'}`}>
					<div className='flex items-center justify-between mb-3'>
						<div className='flex items-center gap-2'>
							<span className={`text-lg ${allPassed ? 'text-success' : 'text-danger'}`}>
								{allPassed ? '✅' : '❌'}
							</span>
							<span className='font-semibold'>
								{allPassed ? 'All Tests Passed!' : 'Some Tests Failed'}
							</span>
						</div>
						<span className={`text-sm font-mono px-2 py-1 rounded chip ${allPassed ? 'chip-success' : 'chip-danger'}`}>
							{totalCorrect}/{totalCases} passed
						</span>
					</div>
					<div className='flex items-center gap-6 text-sm text-muted'>
						<div className='flex items-center gap-1'>
							<span>⚡</span>
							<span>{data.status_runtime || '0 ms'}</span>
						</div>
						<div className='flex items-center gap-1'>
							<span>💾</span>
							<span>{data.status_memory || '0 MB'}</span>
						</div>
						<div className='flex items-center gap-1'>
							<span>🔤</span>
							<span>{data.pretty_lang || data.lang}</span>
						</div>
					</div>
				</div>

				<div className='space-y-3'>
					{outputs.map((output, i) => {
						const passed = compareResult[i] === '1';
						const exp = expected[i] || '';
						const out = output || '';

						return (
							<div key={i} className={`rounded-lg panel ${passed ? 'status-success' : 'status-danger'}`}>
								<div className='flex items-center justify-between p-3 border-b border-panel'>
									<div className='flex items-center gap-2'>
										<span className={`text-lg ${passed ? 'text-success' : 'text-danger'}`}>
											{passed ? '✅' : '❌'}
										</span>
										<span className='font-medium'>Test Case {i + 1}</span>
									</div>
									<span className={`text-xs px-2 py-1 rounded font-medium ${passed ? 'chip chip-success' : 'chip chip-danger'}`}>
										{passed ? 'PASSED' : 'FAILED'}
									</span>
								</div>

								<div className='p-3 space-y-3 text-sm'>
									{testcases[i] && (
										<div>
											<div className='text-muted text-xs uppercase tracking-wide mb-2'>
												Input
											</div>
											<div className='space-y-1'>
												{testcases[i].map((param, paramIdx) => (
													<div key={paramIdx} className='flex items-start gap-2'>
														<span className='text-info font-medium min-w-0'>
															{metaData.params[paramIdx]?.name || `param${paramIdx + 1}`}:
														</span>
														<span className='font-mono text-xs px-2 py-1 rounded flex-1 code-surface'>
															{param}
														</span>
													</div>
												))}
											</div>
										</div>
									)}

									<div className='grid grid-cols-2 gap-3'>
										<div>
											<div className='text-muted text-xs uppercase tracking-wide mb-1'>
												Expected
											</div>
											<div className='font-mono text-xs p-2 rounded break-all code-surface'>
												{exp}
											</div>
										</div>
										<div>
											<div className='text-muted text-xs uppercase tracking-wide mb-1'>
												Output
											</div>
											<div className={`font-mono text-xs p-2 rounded break-all ${passed ? 'chip chip-success' : 'chip chip-danger'}`}>
												{out}
											</div>
										</div>
									</div>

									{data.std_output_list && data.std_output_list[i] && (
										<div className='mt-3'>
											<div className='text-muted text-xs uppercase tracking-wide mb-1'>
												Standard Output
											</div>
											<div className='font-mono text-xs p-2 rounded break-all whitespace-pre-wrap code-surface'>
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
