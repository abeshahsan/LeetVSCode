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

export default function TestRunnerPane({ problem }) {
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
		<div className='flex flex-col gap-3'>
			<div className='flex items-center justify-between'>
				<h3 className='text-white font-semibold'>Test Runner</h3>
				<div className='flex gap-2'>
					<button
						onClick={addTestcase}
						className='px-3 py-1 text-sm rounded bg-gray-700 hover:bg-gray-600'
					>
						+ Add Case
					</button>
					<button
						onClick={runRemote}
						disabled={!problem || testcases.length === 0}
						className='px-3 py-1 text-sm rounded bg-blue-700 hover:bg-blue-600 disabled:opacity-50'
					>
						{remoteRunning ? "Running..." : "Run Remotely"}
					</button>
				</div>
			</div>

			{/* Function signature display */}
			{metaData.params.length > 0 && (
				<div className='p-3 rounded bg-gray-800 border border-gray-700'>
					<div className='text-sm text-gray-400 mb-1'>Function Signature:</div>
					<div className='text-sm font-mono text-gray-300'>
						{metaData.functionName}({metaData.params.map((p) => `${p.type} ${p.name}`).join(", ")})
					</div>
				</div>
			)}

			{/* Test cases */}
			<div className='flex flex-col gap-2'>
				<div className='text-sm text-gray-400'>
					Test Cases {metaData.params.length > 0 && `(${metaData.params.length} parameters each):`}
				</div>

				{testcases.length === 0 && (
					<div className='text-gray-500 text-sm'>No test cases. Click "+ Add Case" to add.</div>
				)}

				{testcases.map((testCase, caseIdx) => (
					<div
						key={caseIdx}
						className='p-3 rounded border border-gray-700 bg-gray-900/50'
					>
						<div className='flex items-center justify-between mb-2'>
							<span className='text-sm font-semibold text-gray-300'>Test Case {caseIdx + 1}</span>
							<button
								onClick={() => removeTestcase(caseIdx)}
								className='px-2 py-1 text-xs rounded bg-red-700 hover:bg-red-600'
							>
								Remove
							</button>
						</div>

						<div className='space-y-2'>
							{testCase.map((param, paramIdx) => (
								<div key={paramIdx}>
									{metaData.params[paramIdx] && (
										<label className='block text-xs text-gray-400 mb-1'>
											{metaData.params[paramIdx].name} ({metaData.params[paramIdx].type})
										</label>
									)}
									<textarea
										value={param}
										onChange={(e) => updateTestcaseParam(caseIdx, paramIdx, e.target.value)}
										placeholder={metaData.params[paramIdx]?.name || `Parameter ${paramIdx + 1}`}
										spellCheck={false}
										className='w-full h-12 p-2 font-mono text-sm bg-[#161616] border border-gray-800 rounded text-gray-200 resize-none'
									/>
								</div>
							))}
						</div>
					</div>
				))}
			</div>

			{/* Remote results */}
			{remoteResults && (
				<div className='mt-2'>
					<div className='text-sm text-gray-400 mb-1'>Remote Results:</div>
					{remoteResults.type === "response" &&
						(() => {
							const data = remoteResults.data;
							if (data?.code_answer && data?.expected_code_answer && data?.compare_result) {
								const outputs = data.code_answer.slice(0, -1) || [];
								const expected = data.expected_code_answer;
								const compareResult = data.compare_result;
								const totalCorrect = data.total_correct || 0;
								const totalCases = data.total_testcases || outputs.length;

								return (
									<div className='space-y-3'>
										{/* Summary */}
										<div className='p-2 rounded bg-gray-800 border border-gray-700'>
											<div className='flex items-center justify-between text-sm'>
												<span className='text-gray-300'>
													{data.pretty_lang || data.lang} • {data.status_runtime || "0 ms"} •{" "}
													{data.status_memory || "0 MB"}
												</span>
												<span
													className={
														totalCorrect === totalCases ? "text-green-400" : "text-red-400"
													}
												>
													{totalCorrect}/{totalCases} passed
												</span>
											</div>
										</div>

										{/* Individual test cases */}
										<div className='space-y-2'>
											{outputs.map((output, i) => {
												const passed = compareResult[i] === "1";
												const exp = expected[i] || "";
												const out = output || "";

												return (
													<div
														key={i}
														className={`p-3 rounded border ${
															passed
																? "border-green-700 bg-green-900/20"
																: "border-red-700 bg-red-900/20"
														}`}
													>
														<div className='flex items-center justify-between mb-2'>
															<span className='text-sm font-semibold'>
																{passed ? "✅" : "❌"} Test Case {i + 1}
															</span>
															<span
																className={`text-xs px-2 py-1 rounded ${
																	passed
																		? "bg-green-800 text-green-200"
																		: "bg-red-800 text-red-200"
																}`}
															>
																{passed ? "PASS" : "FAIL"}
															</span>
														</div>

														<div className='space-y-1 text-xs'>
															<div className='grid grid-cols-1 gap-1'>
																{testcases[i] &&
																	testcases[i].map((param, paramIdx) => (
																		<div key={paramIdx}>
																			<span className='text-gray-400'>
																				{metaData.params[paramIdx]?.name ||
																					`param${paramIdx + 1}`}
																				:
																			</span>
																			<span className='text-gray-300 ml-1'>
																				{param}
																			</span>
																		</div>
																	))}
															</div>
															<div>
																<span className='text-gray-400'>Expected: </span>
																<span className='text-gray-300'>{exp}</span>
															</div>
															<div>
																<span className='text-gray-400'>Output: </span>
																<span
																	className={
																		passed ? "text-green-300" : "text-red-300"
																	}
																>
																	{out}
																</span>
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
									<pre className='text-xs text-gray-300 whitespace-pre-wrap p-2 rounded border border-gray-800 bg-[#101010]'>
										{JSON.stringify(data, null, 2)}
									</pre>
								);
							}
						})()}
					{remoteResults.type === "error" && <div className='text-red-400'>{remoteResults.error}</div>}
					{remoteResults.type === "poll" && (
						<div className='space-y-2'>
							{remoteResults.polls.map((p, i) => (
								<pre
									key={i}
									className='text-xs text-gray-300 whitespace-pre-wrap p-2 rounded border border-gray-800 bg-[#101010]'
								>
									{JSON.stringify(p, null, 2)}
								</pre>
							))}
						</div>
					)}
					{remoteResults.type === "pollError" && <div className='text-red-400'>{remoteResults.error}</div>}
				</div>
			)}
		</div>
	);
}
