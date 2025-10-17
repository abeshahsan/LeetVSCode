import { useEffect, useMemo, useState } from "react";

// Parse problem metadata to get parameter information
function parseMetaData(problem) {
	try {
		const metaStr = problem?.question?.metaData || problem?.metaData;
		if (!metaStr) return { params: [] };

		const meta = typeof metaStr === "string" ? JSON.parse(metaStr) : metaStr;
		return {
			params: meta?.params || [],
			functionName: meta?.name || "solution",
		};
	} catch {
		return { params: [] };
	}
}

// Parse example test cases into grouped format based on parameter count
function parseExampleTestcases(exampleStr, paramCount) {
	if (!exampleStr || paramCount <= 0) return [];

	const lines = exampleStr
		.split(/\r?\n/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);

	// Group lines by parameter count
	const testCases = [];
	for (let i = 0; i < lines.length; i += paramCount) {
		const params = lines.slice(i, i + paramCount);
		if (params.length === paramCount) {
			testCases.push(params);
		}
	}

	return testCases;
}

export default function TestRunnerPane({ problem, onSubmit }) {
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
		// Initialize with examples
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

		// Convert testcases to the format expected by backend
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
			}
		}

		window.addEventListener("vscode-message", handler);
		return () => window.removeEventListener("vscode-message", handler);
	}, []);

	return (
		<div className='h-full flex flex-col bg-[#0a0a0a]'>
			{/* Header Section */}
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
									<div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
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
							disabled={!problem}
							className='px-4 py-1.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-2'
						>
							<span>📤</span>
							Submit
						</button>
					</div>
				</div>

				{/* Function signature display */}
				{metaData.params.length > 0 && (
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
				)}
			</div>

			{/* Test cases section */}
			<div className='flex-1 overflow-auto p-4'>
				<div className='flex items-center justify-between mb-4'>
					<div className='text-sm font-medium text-gray-300'>
						Test Cases {metaData.params.length > 0 && `(${metaData.params.length} parameters)`}
					</div>
					<div className='text-xs text-gray-500'>
						{testcases.length} case{testcases.length !== 1 ? 's' : ''}
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
										<span className='text-sm font-medium text-gray-300'>
											Case {caseIdx + 1}
										</span>
										{caseIdx < examples.length && (
											<span className='text-xs px-2 py-0.5 bg-blue-600/20 text-blue-300 rounded border border-blue-600/30'>
												Example
											</span>
										)}
									</div>
									<button
										onClick={() => removeTestcase(caseIdx)}
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
												onChange={(e) => updateTestcaseParam(caseIdx, paramIdx, e.target.value)}
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
			</div>

			{/* Results Section */}
			{remoteResults && (
				<div className='border-t border-gray-800 bg-[#1a1a1a]'>
					<div className='p-4'>
						<div className='text-lg font-semibold text-white mb-3 flex items-center gap-2'>
							📊 Results
						</div>
						{remoteResults.type === "response" &&
							(() => {
								const data = remoteResults.data;
								if (data?.code_answer && data?.expected_code_answer && data?.compare_result) {
									const outputs = data.code_answer.slice(0, -1) || [];
									const expected = data.expected_code_answer;
									const compareResult = data.compare_result;
									const totalCorrect = data.total_correct || 0;
									const totalCases = data.total_testcases || outputs.length;
									const allPassed = totalCorrect === totalCases;

									return (
										<div className='space-y-4'>
											{/* Summary Card */}
											<div className={`p-4 rounded-lg border ${
												allPassed 
													? 'bg-green-900/20 border-green-700/50' 
													: 'bg-red-900/20 border-red-700/50'
											}`}>
												<div className='flex items-center justify-between mb-3'>
													<div className='flex items-center gap-2'>
														<span className={`text-lg ${allPassed ? 'text-green-400' : 'text-red-400'}`}>
															{allPassed ? '✅' : '❌'}
														</span>
														<span className={`font-semibold ${allPassed ? 'text-green-300' : 'text-red-300'}`}>
															{allPassed ? 'All Tests Passed!' : 'Some Tests Failed'}
														</span>
													</div>
													<span className={`text-sm font-mono px-2 py-1 rounded ${
														allPassed ? 'bg-green-800/50 text-green-200' : 'bg-red-800/50 text-red-200'
													}`}>
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

											{/* Individual test cases */}
											<div className='space-y-3'>
												{outputs.map((output, i) => {
													const passed = compareResult[i] === "1";
													const exp = expected[i] || "";
													const out = output || "";

													return (
														<div
															key={i}
															className={`border rounded-lg ${
																passed
																	? "border-green-700/50 bg-green-900/10"
																	: "border-red-700/50 bg-red-900/10"
															}`}
														>
															<div className='flex items-center justify-between p-3 border-b border-gray-700'>
																<div className='flex items-center gap-2'>
																	<span className={`text-lg ${passed ? 'text-green-400' : 'text-red-400'}`}>
																		{passed ? "✅" : "❌"}
																	</span>
																	<span className='font-medium text-gray-300'>
																		Test Case {i + 1}
																	</span>
																</div>
																<span
																	className={`text-xs px-2 py-1 rounded font-medium ${
																		passed
																			? "bg-green-800/50 text-green-200 border border-green-700/50"
																			: "bg-red-800/50 text-red-200 border border-red-700/50"
																	}`}
																>
																	{passed ? "PASSED" : "FAILED"}
																</span>
															</div>

															<div className='p-3 space-y-3 text-sm'>
																{/* Input parameters */}
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

																{/* Expected vs Output */}
																<div className='grid grid-cols-2 gap-3'>
																	<div>
																		<div className='text-gray-400 text-xs uppercase tracking-wide mb-1'>Expected</div>
																		<div className='font-mono text-xs bg-gray-800/50 p-2 rounded text-gray-300 break-all'>
																			{exp}
																		</div>
																	</div>
																	<div>
																		<div className='text-gray-400 text-xs uppercase tracking-wide mb-1'>Output</div>
																		<div className={`font-mono text-xs p-2 rounded break-all ${
																			passed 
																				? 'bg-green-900/20 text-green-300 border border-green-700/30' 
																				: 'bg-red-900/20 text-red-300 border border-red-700/30'
																		}`}>
																			{out}
																		</div>
																	</div>
																</div>
															</div>
														</div>
													);
												})}
											</div>
										</div>
									);
								} else {
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
							})()}
						{remoteResults.type === "error" && (
							<div className='p-4 rounded-lg border border-red-600/50 bg-red-900/20'>
								<div className='text-red-300 font-medium mb-2'>❌ Execution Error</div>
								<div className='text-red-200 text-sm'>{remoteResults.error}</div>
							</div>
						)}
						{remoteResults.type === "poll" && (
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
						)}
						{remoteResults.type === "pollError" && (
							<div className='p-4 rounded-lg border border-red-600/50 bg-red-900/20'>
								<div className='text-red-300 font-medium mb-2'>❌ Polling Error</div>
								<div className='text-red-200 text-sm'>{remoteResults.error}</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
