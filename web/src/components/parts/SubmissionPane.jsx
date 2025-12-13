function parseFailedTestInput(input, expectedCount) {
	if (input == null) return [];

	try {
		const parsed = JSON.parse(input);
		if (Array.isArray(parsed)) {
			return parsed.map((p) => {
				if (p === null || p === undefined) return String(p);
				if (typeof p === "object") return JSON.stringify(p);
				return String(p);
			});
		}
		if (typeof parsed === "string" || typeof parsed === "number" || typeof parsed === "boolean") {
			return [String(parsed)];
		}
	} catch (e) {
		// ignore
	}

	const byNewline = String(input)
		.split(/\r?\n/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	if (byNewline.length >= Math.max(1, expectedCount)) {
		return byNewline;
	}

	const byComma = String(input)
		.split(",")
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	if (byComma.length >= Math.max(1, expectedCount)) {
		return byComma;
	}

	return [String(input)];
}

export default function SubmissionPane({ submissionLoading, submissionResult, metaData }) {
	return (
		<div className='h-full p-4 bg-[#0a0a0a] overflow-auto'>
			<div className='text-center'>
				<h2 className='text-xl font-semibold text-white mb-4'>Submission Results</h2>

				{submissionLoading && (
					<div className='bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/50 rounded-xl p-6 mb-6 shadow-lg backdrop-blur-sm'>
						<div className='flex items-center justify-center mb-4'>
							<div className='animate-spin mr-3 text-2xl'>⏳</div>
							<div className='text-blue-300 text-xl font-semibold'>Submitting Solution...</div>
						</div>
						<div className='text-center'>
							<div className='text-gray-300 mb-3'>Evaluating your code against test cases</div>
							<div className='w-full bg-gray-700 rounded-full h-2'>
								<div
									className='bg-blue-500 h-2 rounded-full animate-pulse'
									style={{ width: "100%" }}
								></div>
							</div>
						</div>
					</div>
				)}

				{!submissionLoading && submissionResult && (
					<div className='animate-fadeIn'>
						{submissionResult.status === "Accepted" ? (
							<div className='bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/50 rounded-xl p-6 mb-6 shadow-xl backdrop-blur-sm'>
								<div className='flex items-center justify-center mb-4'>
									<div className='text-3xl mr-3 animate-bounce'>🎉</div>
									<div>
										<div className='text-green-300 text-2xl font-bold'>Accepted!</div>
										<div className='text-green-400 text-sm'>Solution passed all test cases</div>
									</div>
								</div>
								<div className='text-center text-gray-300 bg-green-900/20 rounded-lg p-3'>
									<span className='text-green-400 font-medium'>✓</span> Your solution has been
									successfully submitted and verified!
								</div>
							</div>
						) : (
							<div className='bg-gradient-to-r from-red-900/30 to-pink-900/30 border border-red-500/50 rounded-xl p-6 mb-6 shadow-xl backdrop-blur-sm'>
								<div className='flex items-center justify-center mb-4'>
									<div className='text-3xl mr-3'>❌</div>
									<div>
										<div className='text-red-300 text-2xl font-bold'>
											{submissionResult.status || "Failed"}
										</div>
										<div className='text-red-400 text-sm'>Solution needs improvement</div>
									</div>
								</div>
								<div className='text-center text-gray-300 bg-red-900/20 rounded-lg p-3'>
									<span className='text-red-400 font-medium'>✗</span>{" "}
									{submissionResult.message || "Submission failed. Please try again."}
								</div>
							</div>
						)}

						{submissionResult.status === "Accepted" && (
							<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-8'>
								{submissionResult.runtime && (
									<div className='bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 shadow-lg'>
										<div className='flex items-center mb-3'>
											<span className='text-xl mr-2'>⚡</span>
											<span className='text-gray-400 text-sm font-medium uppercase tracking-wide'>
												Runtime
											</span>
										</div>
										<div className='text-white text-2xl font-bold mb-1'>
											{submissionResult.runtime}
										</div>
										{submissionResult.runtime_percentile && (
											<div className='flex items-center'>
												<div className='text-green-400 text-sm font-medium'>
													🚀 Beats {submissionResult.runtime_percentile}% of users
												</div>
											</div>
										)}
									</div>
								)}
								{submissionResult.memory && (
									<div className='bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 shadow-lg'>
										<div className='flex items-center mb-3'>
											<span className='text-xl mr-2'>💾</span>
											<span className='text-gray-400 text-sm font-medium uppercase tracking-wide'>
												Memory
											</span>
										</div>
										<div className='text-white text-2xl font-bold mb-1'>
											{submissionResult.memory}
										</div>
										{submissionResult.memory_percentile && (
											<div className='flex items-center'>
												<div className='text-purple-400 text-sm font-medium'>
													🎯 Beats {submissionResult.memory_percentile}% of users
												</div>
											</div>
										)}
									</div>
								)}
								<div className='bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700/50 hover:border-cyan-500/30 transition-all duration-300 shadow-lg'>
									<div className='flex items-center mb-3'>
										<span className='text-xl mr-2'>🔧</span>
										<span className='text-gray-400 text-sm font-medium uppercase tracking-wide'>
											Language
										</span>
									</div>
									<div className='text-white text-2xl font-bold mb-1'>
										{submissionResult.lang || "JavaScript"}
									</div>
									<div className='text-cyan-400 text-sm font-medium'>Compiled Successfully</div>
								</div>
							</div>
						)}

						{(submissionResult.compile_error ||
							submissionResult.full_compile_error ||
							submissionResult.status === "Compile Error") && (
							<div className='mt-8'>
								<div className='flex items-center mb-4'>
									<span className='text-2xl mr-3'>🔧</span>
									<h3 className='text-xl font-bold text-white'>Compilation Error</h3>
								</div>
								<div className='bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-xl p-6 border border-orange-500/50 shadow-lg backdrop-blur-sm'>
									<div className='flex items-center mb-4'>
										<span className='text-orange-400 text-2xl mr-3'>⚠️</span>
										<div>
											<div className='text-orange-300 text-lg font-bold'>Compilation Failed</div>
											<div className='text-orange-400 text-sm'>
												Please fix the syntax errors in your code
											</div>
										</div>
									</div>
									<div className='bg-orange-950/50 border border-orange-700/30 rounded-lg p-4'>
										<div className='text-orange-300 font-medium text-sm mb-2'>Error Details:</div>
										<pre className='font-mono text-orange-200 text-xs whitespace-pre-wrap overflow-x-auto'>
											{submissionResult.full_compile_error ||
												submissionResult.compile_error ||
												"No error details available"}
										</pre>
									</div>
								</div>
							</div>
						)}

						{(submissionResult.runtime_error ||
							submissionResult.full_runtime_error ||
							submissionResult.status === "Runtime Error") && (
							<div className='mt-8'>
								<div className='flex items-center mb-4'>
									<span className='text-2xl mr-3'>⚠️</span>
									<h3 className='text-xl font-bold text-white'>Runtime Error</h3>
								</div>
								<div className='bg-gradient-to-br from-purple-900/30 to-red-900/30 rounded-xl p-6 border border-purple-500/50 shadow-lg backdrop-blur-sm'>
									<div className='flex items-center mb-4'>
										<span className='text-purple-400 text-2xl mr-3'>💥</span>
										<div>
											<div className='text-purple-300 text-lg font-bold'>
												Runtime Error Occurred
											</div>
											<div className='text-purple-400 text-sm'>
												Your code encountered an error during execution
											</div>
										</div>
									</div>
									<div className='bg-purple-950/50 border border-purple-700/30 rounded-lg p-4'>
										<div className='text-purple-300 font-medium text-sm mb-2'>Error Details:</div>
										<pre className='font-mono text-purple-200 text-xs whitespace-pre-wrap overflow-x-auto'>
											{submissionResult.full_runtime_error ||
												submissionResult.runtime_error ||
												"No error details available"}
										</pre>
									</div>
								</div>
							</div>
						)}

						{submissionResult.status !== "Accepted" && submissionResult.run_success === false && (
							<div className='mt-8'>
								<div className='flex items-center mb-4'>
									<span className='text-2xl mr-3'>🐛</span>
									<h3 className='text-xl font-bold text-white'>Debug Info</h3>
								</div>
								<div className='bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-xl p-6 border border-gray-600/50 shadow-lg backdrop-blur-sm'>
									<div className='text-gray-300 font-medium text-sm mb-2'>Raw Response Data:</div>
									<pre className='font-mono text-gray-200 text-xs whitespace-pre-wrap overflow-x-auto bg-gray-950/50 border border-gray-700/30 rounded p-3 max-h-60 overflow-y-auto'>
										{JSON.stringify(submissionResult, null, 2)}
									</pre>
								</div>
							</div>
						)}

						{submissionResult.total_testcases && (
							<div className='mt-8'>
								<div className='flex items-center mb-4'>
									<span className='text-2xl mr-3'>📋</span>
									<h3 className='text-xl font-bold text-white'>Test Case Results</h3>
								</div>
								<div className='bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl p-6 border border-gray-700/50 shadow-lg backdrop-blur-sm'>
									{submissionResult.status === "Accepted" ? (
										<div className='flex items-center justify-center p-4 bg-green-900/30 rounded-xl border border-green-500/30'>
											<span className='text-2xl mr-3'>🎯</span>
											<div>
												<div className='text-green-300 text-lg font-bold'>Perfect Score!</div>
												<div className='text-green-400 text-sm'>
													All {submissionResult.total_testcases} test cases passed
												</div>
											</div>
										</div>
									) : (
										<div>
											<div className='flex items-center p-4 bg-red-900/30 rounded-xl border border-red-500/30 mb-4'>
												<span className='text-2xl mr-3'>🎯</span>
												<div>
													<div className='text-red-300 text-lg font-bold'>
														Test Case {(submissionResult.total_correct || 0) + 1} Failed
													</div>
													<div className='text-red-400 text-sm'>
														{submissionResult.total_correct || 0} of{" "}
														{submissionResult.total_testcases} passed
													</div>
												</div>
											</div>

											{submissionResult.last_testcase && (
												<div className='bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-600/50 rounded-xl p-4 shadow-inner'>
													<div className='flex items-center mb-3'>
														<span className='text-lg mr-2'>🔍</span>
														<span className='text-white font-semibold'>
															Failed Test Case Details
														</span>
													</div>
													<div className='space-y-4'>
														<div className='bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3'>
															<div className='flex items-center mb-3'>
																<span className='text-yellow-400 mr-2'>📥</span>
																<span className='text-yellow-300 font-semibold text-sm'>
																	Input
																</span>
															</div>

															{(() => {
																const parsedParams = parseFailedTestInput(
																	submissionResult.last_testcase,
																	metaData.params.length
																);

																if (
																	parsedParams.length > 0 &&
																	metaData.params.length > 0
																) {
																	return (
																		<div className='space-y-2'>
																			{parsedParams.map((param, idx) => (
																				<div
																					key={idx}
																					className='flex items-start gap-3'
																				>
																					<span className='text-blue-300 font-medium min-w-0 text-sm'>
																						{metaData.params[idx]?.name ||
																							`param${idx + 1}`}
																						<span className='text-gray-400 ml-1'>
																							(
																							{metaData.params[idx]
																								?.type || "unknown"}
																							)
																						</span>
																						:
																					</span>
																					<div className='font-mono text-yellow-200 bg-yellow-900/10 px-2 py-1 rounded border flex-1 text-xs'>
																						{param}
																					</div>
																				</div>
																			))}
																		</div>
																	);
																} else {
																	return (
																		<div className='font-mono text-yellow-200 bg-yellow-900/10 p-2 rounded border text-xs'>
																			{submissionResult.last_testcase}
																		</div>
																	);
																}
															})()}
														</div>
													</div>
												</div>
											)}
										</div>
									)}

									{submissionResult.expected_output && (
										<div className='bg-green-900/20 border border-green-600/30 rounded-lg p-3'>
											<div className='flex items-center mb-2'>
												<span className='text-green-400 mr-2'>✅</span>
												<span className='text-green-300 font-semibold text-sm'>
													Expected Output
												</span>
											</div>
											<div className='font-mono text-green-200 bg-green-900/10 p-2 rounded border'>
												{submissionResult.expected_output}
											</div>
										</div>
									)}

									{submissionResult.code_output && (
										<div className='bg-red-900/20 border border-red-600/30 rounded-lg p-3'>
											<div className='flex items-center mb-2'>
												<span className='text-red-400 mr-2'>❌</span>
												<span className='text-red-300 font-semibold text-sm'>Your Output</span>
											</div>
											<div className='font-mono text-red-200 bg-red-900/10 p-2 rounded border'>
												{submissionResult.code_output}
											</div>
										</div>
									)}

									{submissionResult.std_output_list && (
										<div className='bg-blue-900/20 border border-blue-600/30 rounded-lg p-3'>
											<div className='flex items-center mb-2'>
												<span className='text-blue-400 mr-2'>📋</span>
												<span className='text-blue-300 font-semibold text-sm'>
													Standard Output
												</span>
											</div>
											<div className='font-mono text-blue-200 bg-blue-900/10 p-2 rounded border whitespace-pre-wrap'>
												{Array.isArray(submissionResult.std_output_list)
													? submissionResult.std_output_list.join("\n")
													: submissionResult.std_output_list}
											</div>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				)}

				{!submissionLoading && !submissionResult && (
					<div className='bg-gradient-to-br from-gray-800/30 to-gray-900/50 border border-gray-600/50 rounded-xl p-8 mb-6 text-center shadow-lg backdrop-blur-sm'>
						<div className='text-6xl mb-4'>🚀</div>
						<div className='text-gray-300 text-xl font-semibold mb-2'>Ready to Submit?</div>
						<div className='text-gray-400 mb-4'>Test your solution against all LeetCode test cases</div>
						<div className='inline-flex items-center px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm'>
							<span className='mr-2'>💡</span>
							Click the Submit button in the Test Runner to get started
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
