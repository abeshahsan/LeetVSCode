import { useState, useEffect, useMemo } from "react";
import TestRunnerPane from "./test-runner-pane";
import { parseMetaData, getStatusClass, getLikePercentage } from "../utils/ui.js";

function ProblemPane({ problem }) {
	const [activeTab, setActiveTab] = useState("description");
	const [tabs, setTabs] = useState([{ id: "description", label: "Description", closable: false }]);
	const [submissionResult, setSubmissionResult] = useState(null);
	const [submissionLoading, setSubmissionLoading] = useState(false);

	const metaData = useMemo(() => parseMetaData(problem), [problem]);

	const html = problem?.content || "<p class='text-gray-400'>No description available.</p>";

	// Determine the user's status for this problem: Solved, Attempted, or Unattempted
	const computeStatus = () => {
		return problem?.status === "ac" ? "Solved" : problem?.status === "notac" ? "Attempted" : "";
	};

	const likes = problem?.likes || 0;
	const dislikes = problem?.dislikes || 0;
	const likePct = getLikePercentage(likes, dislikes);

	const openSubmissionTab = () => {
		const submissionTab = { id: "submission", label: "Submission", closable: true };
		if (!tabs.find((tab) => tab.id === "submission")) {
			setTabs((prev) => [...prev, submissionTab]);
		}
		setActiveTab("submission");
		setSubmissionLoading(true);
	};

	const handleSubmit = () => {
		const selected = window.__SELECTED_LANG__ || data?.defaultLanguage || "cpp";
		setSubmissionLoading(true);
		setSubmissionResult(null);

		// Open submission tab
		openSubmissionTab();

		// Send submit command
		window.vscode.postMessage({
			command: "submit-code",
			slug: problem?.titleSlug,
			langSlug: selected,
		});
	};

	// Handle submission responses from VS Code
	useEffect(() => {
		const handler = (event) => {
			const msg = event.detail || event.data;
			if (!msg || !msg.command) return;

			switch (msg.command) {
				case "submitResponse": {
					// Parse LeetCode submission response
					const data = msg.data;
					const result = {
						status: data.status_msg || (data.state === "SUCCESS" ? "Accepted" : "Failed"),
						runtime: data.display_runtime ? `${data.display_runtime} ms` : data.status_runtime,
						memory: data.status_memory,
						runtime_percentile: data.runtime_percentile
							? Math.round(data.runtime_percentile * 100) / 100
							: null,
						memory_percentile: data.memory_percentile
							? Math.round(data.memory_percentile * 100) / 100
							: null,
						lang: data.pretty_lang || data.lang,
						total_testcases: data.total_testcases,
						total_correct: data.total_correct,
						last_testcase: data.last_testcase,
						expected_output: data.expected_output,
						code_output: data.code_output,
						std_output_list: data.std_output_list,
						submission_id: data.submission_id,

						// Add error details
						compile_error: data.compile_error,
						full_compile_error: data.full_compile_error,
						runtime_error: data.runtime_error,
						full_runtime_error: data.full_runtime_error,
						run_success: data.run_success,
					};

					// Add error messages for failed submissions
					if (data.compile_error || data.status_msg === "Compile Error") {
						result.message = "Compilation failed. Please fix the syntax errors.";
					} else if (data.runtime_error || data.status_msg === "Runtime Error") {
						result.message = "Runtime error occurred during execution.";
					} else if (data.status_msg !== "Accepted" && data.state !== "SUCCESS") {
						result.message = `Wrong Answer - Failed on test case ${(data.total_correct || 0) + 1}`;
					}

					setSubmissionResult(result);
					setSubmissionLoading(false);
					break;
				}
				case "submitError": {
					setSubmissionResult({
						status: "Error",
						message: msg.error || "Submission failed. Please try again.",
					});
					setSubmissionLoading(false);
					break;
				}
			}
		};

		window.addEventListener("vscode-message", handler);
		return () => window.removeEventListener("vscode-message", handler);
	}, []);

	const closeTab = (tabId) => {
		if (tabId === "description") return; // Can't close description tab
		setTabs((prev) => prev.filter((tab) => tab.id !== tabId));
		if (activeTab === tabId) {
			setActiveTab("description");
		}
	};

	return (
		<div className='h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/30'>
			{/* Tab Header */}
			<div className='flex items-center border-b border-blue-500/30 bg-gradient-to-r from-slate-900/80 via-blue-900/10 to-slate-900/80 backdrop-blur-sm'>
				{tabs.map((tab) => (
					<div
						key={tab.id}
						className='flex items-center'
					>
						<button
							onClick={() => setActiveTab(tab.id)}
							className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-300 ${
								activeTab === tab.id
									? "text-cyan-400 border-cyan-400 bg-gradient-to-t from-cyan-500/10 to-transparent shadow-lg shadow-cyan-500/20"
									: "text-gray-400 border-transparent hover:text-cyan-300 hover:border-cyan-500/50 hover:bg-slate-800/50"
							}`}
						>
							{tab.label}
						</button>
						{tab.closable && (
							<button
								onClick={() => closeTab(tab.id)}
								className='ml-1 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all duration-200'
							>
								×
							</button>
						)}
					</div>
				))}
			</div>

			{/* Tab Content */}
			<div className='flex-1 overflow-hidden'>
				{activeTab === "description" && (
					<div className='h-full flex flex-col'>
						{/* Problem Header Section */}
						<div className='border-b border-blue-500/20 p-5 bg-gradient-to-br from-slate-900/60 via-blue-900/20 to-purple-900/20 backdrop-blur-sm'>
							{/* Status Badge */}
							<div className='flex items-center justify-between'>
								<div />
								<div className='flex items-center gap-2'>
									{(() => {
										const status = computeStatus();
										return (
											<span
												className={`px-3 py-1.5 text-xs font-bold rounded-lg border shadow-lg ${
													status === 'Solved' ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50 text-green-300' :
													status === 'Attempted' ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/50 text-yellow-300' :
													'bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-400/50 text-gray-300'
												} ${getStatusClass(status)}`}
											>
												{status}
											</span>
										);
									})()}
								</div>
							</div>

							{/* Stats Row */}
							<div className='flex items-center gap-6 text-sm mt-3'>
								{problem?.acRate && (
									<div className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30'>
										<span className='text-green-400 text-base'>✓</span>
										<span className='text-green-300 font-semibold'>{parseFloat(problem.acRate).toFixed(1)}%</span>
										<span className='text-green-400/70 text-xs'>Accepted</span>
									</div>
								)}
								{(problem?.likes || problem?.dislikes) && (
									<div className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30'>
										<span className='text-blue-400'>👍</span>
										<span className='text-blue-300 font-semibold'>{likePct}%</span>
										<span className='text-blue-400/70 text-xs'>({problem?.likes || 0} likes)</span>
									</div>
								)}
								{problem?.submissions && (
									<div className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30'>
										<span className='text-purple-400'>📊</span>
										<span className='text-purple-300 font-semibold'>{problem.submissions}</span>
										<span className='text-purple-400/70 text-xs'>submissions</span>
									</div>
								)}
							</div>

							{/* Tags */}
							{problem?.topicTags && problem.topicTags.length > 0 && (
								<div className='flex flex-wrap gap-2 mt-4'>
									{problem.topicTags.slice(0, 8).map((tag, idx) => (
										<span
											key={idx}
											className='px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-slate-700/50 to-slate-600/50 text-cyan-300 rounded-lg hover:from-cyan-600/30 hover:to-blue-600/30 hover:text-cyan-200 border border-slate-600/50 hover:border-cyan-500/50 cursor-pointer transition-all duration-300 shadow-md hover:shadow-cyan-500/20 hover:scale-105'
										>
											{tag.name}
										</span>
									))}
									{problem.topicTags.length > 8 && (
										<span className='px-3 py-1.5 text-xs text-purple-400 font-semibold'>
											+{problem.topicTags.length - 8} more
										</span>
									)}
								</div>
							)}
						</div>

						{/* Problem Description */}
						<div className='flex-1 flex flex-col min-h-0'>
							<div className='flex-1 overflow-auto'>
								<div className='prose prose-invert max-w-none p-4'>
									<div
										className='leetcode-content text-gray-300 leading-relaxed'
										dangerouslySetInnerHTML={{ __html: html }}
									/>
								</div>
							</div>

							{/* Test Runner Section */}
							<div className='border-t border-gray-800 bg-[#0f0f0f]'>
								<TestRunnerPane
									problem={problem}
									onSubmit={handleSubmit}
									isSubmitting={submissionLoading}
								/>
							</div>
						</div>
					</div>
				)}

				{activeTab === "submission" && (
					<div className='h-full p-4 bg-[#0a0a0a] overflow-auto'>
						<div className='text-center'>
							<h2 className='text-xl font-semibold text-white mb-4'>Submission Results</h2>

							{submissionLoading && (
								<div className='bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/50 rounded-xl p-6 mb-6 shadow-lg backdrop-blur-sm'>
									<div className='flex items-center justify-center mb-4'>
										<div className='animate-spin mr-3 text-2xl'>⏳</div>
										<div className='text-blue-300 text-xl font-semibold'>
											Submitting Solution...
										</div>
									</div>
									<div className='text-center'>
										<div className='text-gray-300 mb-3'>
											Evaluating your code against test cases
										</div>
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
													<div className='text-green-400 text-sm'>
														Solution passed all test cases
													</div>
												</div>
											</div>
											<div className='text-center text-gray-300 bg-green-900/20 rounded-lg p-3'>
												<span className='text-green-400 font-medium'>✓</span> Your solution has
												been successfully submitted and verified!
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
													<div className='text-red-400 text-sm'>
														Solution needs improvement
													</div>
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
												<div className='text-cyan-400 text-sm font-medium'>
													Compiled Successfully
												</div>
											</div>
										</div>
									)}

									{/* Show compilation errors */}
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
														<div className='text-orange-300 text-lg font-bold'>
															Compilation Failed
														</div>
														<div className='text-orange-400 text-sm'>
															Please fix the syntax errors in your code
														</div>
													</div>
												</div>
												<div className='bg-orange-950/50 border border-orange-700/30 rounded-lg p-4'>
													<div className='text-orange-300 font-medium text-sm mb-2'>
														Error Details:
													</div>
													<pre className='font-mono text-orange-200 text-xs whitespace-pre-wrap overflow-x-auto'>
														{submissionResult.full_compile_error ||
															submissionResult.compile_error ||
															"No error details available"}
													</pre>
												</div>
											</div>
										</div>
									)}

									{/* Show runtime errors */}
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
													<div className='text-purple-300 font-medium text-sm mb-2'>
														Error Details:
													</div>
													<pre className='font-mono text-purple-200 text-xs whitespace-pre-wrap overflow-x-auto'>
														{submissionResult.full_runtime_error ||
															submissionResult.runtime_error ||
															"No error details available"}
													</pre>
												</div>
											</div>
										</div>
									)}

									{/* Debug: Show raw submission data when errors occur */}
									{submissionResult.status !== "Accepted" &&
										submissionResult.run_success === false && (
											<div className='mt-8'>
												<div className='flex items-center mb-4'>
													<span className='text-2xl mr-3'>🐛</span>
													<h3 className='text-xl font-bold text-white'>Debug Info</h3>
												</div>
												<div className='bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-xl p-6 border border-gray-600/50 shadow-lg backdrop-blur-sm'>
													<div className='text-gray-300 font-medium text-sm mb-2'>
														Raw Response Data:
													</div>
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
															<div className='text-green-300 text-lg font-bold'>
																Perfect Score!
															</div>
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
																	Test Case{" "}
																	{(submissionResult.total_correct || 0) + 1} Failed
																</div>
																<div className='text-red-400 text-sm'>
																	{submissionResult.total_correct || 0} of{" "}
																	{submissionResult.total_testcases} passed
																</div>
															</div>
														</div>

														{/* Show failed test case details */}
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
																			<span className='text-yellow-400 mr-2'>
																				📥
																			</span>
																			<span className='text-yellow-300 font-semibold text-sm'>
																				Input
																			</span>
																		</div>

																		{/* Parse and display individual parameters */}
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
																						{parsedParams.map(
																							(param, idx) => (
																								<div
																									key={idx}
																									className='flex items-start gap-3'
																								>
																									<span className='text-blue-300 font-medium min-w-0 text-sm'>
																										{metaData
																											.params[idx]
																											?.name ||
																											`param${
																												idx + 1
																											}`}
																										<span className='text-gray-400 ml-1'>
																											(
																											{metaData
																												.params[
																												idx
																											]?.type ||
																												"unknown"}
																											)
																										</span>
																										:
																									</span>
																									<div className='font-mono text-yellow-200 bg-yellow-900/10 px-2 py-1 rounded border flex-1 text-xs'>
																										{param}
																									</div>
																								</div>
																							)
																						)}
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

																	{submissionResult.expected_output && (
																		<div className='bg-green-900/20 border border-green-600/30 rounded-lg p-3'>
																			<div className='flex items-center mb-2'>
																				<span className='text-green-400 mr-2'>
																					✅
																				</span>
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
																				<span className='text-red-400 mr-2'>
																					❌
																				</span>
																				<span className='text-red-300 font-semibold text-sm'>
																					Your Output
																				</span>
																			</div>
																			<div className='font-mono text-red-200 bg-red-900/10 p-2 rounded border'>
																				{submissionResult.code_output}
																			</div>
																		</div>
																	)}

																	{submissionResult.std_output_list && (
																		<div className='bg-blue-900/20 border border-blue-600/30 rounded-lg p-3'>
																			<div className='flex items-center mb-2'>
																				<span className='text-blue-400 mr-2'>
																					📋
																				</span>
																				<span className='text-blue-300 font-semibold text-sm'>
																					Standard Output
																				</span>
																			</div>
																			<div className='font-mono text-blue-200 bg-blue-900/10 p-2 rounded border whitespace-pre-wrap'>
																				{Array.isArray(
																					submissionResult.std_output_list
																				)
																					? submissionResult.std_output_list.join(
																							"\n"
																					  )
																					: submissionResult.std_output_list}
																			</div>
																		</div>
																	)}
																</div>
															</div>
														)}
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
									<div className='text-gray-400 mb-4'>
										Test your solution against all LeetCode test cases
									</div>
									<div className='inline-flex items-center px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm'>
										<span className='mr-2'>💡</span>
										Click the Submit button in the Test Runner to get started
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default ProblemPane;
