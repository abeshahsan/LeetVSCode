import { useState, useEffect, useMemo } from 'react';
import TestRunnerPane from './test-runner-pane';

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

// Parse failed test case input into individual parameters
function parseFailedTestInput(inputStr, paramCount) {
	if (!inputStr || paramCount <= 0) return [];

	const lines = inputStr
		.split(/\r?\n/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);

	// Return the first paramCount lines as separate parameters
	return lines.slice(0, paramCount);
}

function ProblemPane({ problem }) {
	const [activeTab, setActiveTab] = useState('description');
	const [tabs, setTabs] = useState([
		{ id: 'description', label: 'Description', closable: false }
	]);
	const [submissionResult, setSubmissionResult] = useState(null);
	const [submissionLoading, setSubmissionLoading] = useState(false);
	
	const metaData = useMemo(() => parseMetaData(problem), [problem]);

	const html = problem?.content || "<p class='text-gray-400'>No description available.</p>";
	
	const getDifficultyColor = (difficulty) => {
		switch (difficulty?.toLowerCase()) {
			case 'easy': return 'text-green-500 bg-green-500/10 border-green-500/20';
			case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
			case 'hard': return 'text-red-500 bg-red-500/10 border-red-500/20';
			default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
		}
	};

	const getLikePercentage = () => {
		const likes = problem?.likes || 0;
		const dislikes = problem?.dislikes || 0;
		const total = likes + dislikes;
		return total > 0 ? Math.round((likes / total) * 100) : 0;
	};

	const openSubmissionTab = () => {
		const submissionTab = { id: 'submission', label: 'Submission', closable: true };
		if (!tabs.find(tab => tab.id === 'submission')) {
			setTabs(prev => [...prev, submissionTab]);
		}
		setActiveTab('submission');
		setSubmissionLoading(true);
	};

	const handleSubmit = () => {
		const selected = window.__SELECTED_LANG__ || "cpp";
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
						runtime_percentile: data.runtime_percentile ? Math.round(data.runtime_percentile * 100) / 100 : null,
						memory_percentile: data.memory_percentile ? Math.round(data.memory_percentile * 100) / 100 : null,
						lang: data.pretty_lang || data.lang,
						total_testcases: data.total_testcases,
						total_correct: data.total_correct,
						last_testcase: data.last_testcase,
						expected_output: data.expected_output,
						code_output: data.code_output,
						submission_id: data.submission_id
					};
					
					// Add error details for failed submissions
					if (data.status_msg !== "Accepted" && data.state !== "SUCCESS") {
						result.message = `Wrong Answer - Failed on test case ${(data.total_correct || 0) + 1}`;
					}
					
					setSubmissionResult(result);
					setSubmissionLoading(false);
					break;
				}
				case "submitError": {
					setSubmissionResult({ 
						status: "Error", 
						message: msg.error || "Submission failed. Please try again." 
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
		if (tabId === 'description') return; // Can't close description tab
		setTabs(prev => prev.filter(tab => tab.id !== tabId));
		if (activeTab === tabId) {
			setActiveTab('description');
		}
	};

	return (
		<div className="h-full flex flex-col bg-[#0a0a0a]">
			{/* Tab Header */}
			<div className="flex items-center border-b border-gray-800 bg-[#1a1a1a]">
				{tabs.map((tab) => (
					<div key={tab.id} className="flex items-center">
						<button
							onClick={() => setActiveTab(tab.id)}
							className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
								activeTab === tab.id
									? 'text-blue-400 border-blue-400 bg-gray-800/50'
									: 'text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-600'
							}`}
						>
							{tab.label}
						</button>
						{tab.closable && (
							<button
								onClick={() => closeTab(tab.id)}
								className="ml-1 p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded"
							>
								×
							</button>
						)}
					</div>
				))}
			</div>

			{/* Tab Content */}
			<div className="flex-1 overflow-hidden">
				{activeTab === 'description' && (
					<div className="h-full flex flex-col">
						{/* Problem Header Section */}
						<div className="border-b border-gray-800 p-4 bg-[#1a1a1a]">
							
							
							{/* Stats Row */}
							<div className="flex items-center gap-6 text-sm text-gray-400">
								{problem?.acRate && (
									<div className="flex items-center gap-1">
										<span className="text-green-500">✓</span>
										<span>Accepted: {parseFloat(problem.acRate).toFixed(1)}%</span>
									</div>
								)}
								{(problem?.likes || problem?.dislikes) && (
									<div className="flex items-center gap-1">
										<span className="text-blue-400">👍</span>
										<span>{getLikePercentage()}%</span>
										<span className="text-gray-500">({problem?.likes || 0})</span>
									</div>
								)}
								{problem?.submissions && (
									<div className="flex items-center gap-1">
										<span className="text-purple-400">📊</span>
										<span>{problem.submissions} submissions</span>
									</div>
								)}
							</div>

							{/* Tags */}
							{problem?.topicTags && problem.topicTags.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-3">
									{problem.topicTags.slice(0, 8).map((tag, idx) => (
										<span
											key={idx}
											className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 cursor-pointer"
										>
											{tag.name}
										</span>
									))}
									{problem.topicTags.length > 8 && (
										<span className="px-2 py-1 text-xs text-gray-500">
											+{problem.topicTags.length - 8} more
										</span>
									)}
								</div>
							)}
						</div>

						{/* Problem Description */}
						<div className="flex-1 flex flex-col min-h-0">
							<div className="flex-1 overflow-auto">
								<div className="prose prose-invert max-w-none p-4">
									<div 
										className="leetcode-content text-gray-300 leading-relaxed"
										dangerouslySetInnerHTML={{ __html: html }} 
									/>
								</div>
							</div>

							{/* Test Runner Section */}
							<div className="border-t border-gray-800 bg-[#0f0f0f]">
								<TestRunnerPane problem={problem} onSubmit={handleSubmit} isSubmitting={submissionLoading} />
							</div>
						</div>
					</div>
				)}

				{activeTab === 'submission' && (
					<div className="h-full p-4 bg-[#0a0a0a] overflow-auto">
						<div className="text-center">
							<h2 className="text-xl font-semibold text-white mb-4">Submission Results</h2>
							
							{submissionLoading && (
								<div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/50 rounded-xl p-6 mb-6 shadow-lg backdrop-blur-sm">
									<div className="flex items-center justify-center mb-4">
										<div className="animate-spin mr-3 text-2xl">⏳</div>
										<div className="text-blue-300 text-xl font-semibold">Submitting Solution...</div>
									</div>
									<div className="text-center">
										<div className="text-gray-300 mb-3">Evaluating your code against test cases</div>
										<div className="w-full bg-gray-700 rounded-full h-2">
											<div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
										</div>
									</div>
								</div>
							)}

							{!submissionLoading && submissionResult && (
								<div className="animate-fadeIn">
									{submissionResult.status === 'Accepted' ? (
										<div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/50 rounded-xl p-6 mb-6 shadow-xl backdrop-blur-sm">
											<div className="flex items-center justify-center mb-4">
												<div className="text-3xl mr-3 animate-bounce">🎉</div>
												<div>
													<div className="text-green-300 text-2xl font-bold">Accepted!</div>
													<div className="text-green-400 text-sm">Solution passed all test cases</div>
												</div>
											</div>
											<div className="text-center text-gray-300 bg-green-900/20 rounded-lg p-3">
												<span className="text-green-400 font-medium">✓</span> Your solution has been successfully submitted and verified!
											</div>
										</div>
									) : (
										<div className="bg-gradient-to-r from-red-900/30 to-pink-900/30 border border-red-500/50 rounded-xl p-6 mb-6 shadow-xl backdrop-blur-sm">
											<div className="flex items-center justify-center mb-4">
												<div className="text-3xl mr-3">❌</div>
												<div>
													<div className="text-red-300 text-2xl font-bold">{submissionResult.status || 'Failed'}</div>
													<div className="text-red-400 text-sm">Solution needs improvement</div>
												</div>
											</div>
											<div className="text-center text-gray-300 bg-red-900/20 rounded-lg p-3">
												<span className="text-red-400 font-medium">✗</span> {submissionResult.message || 'Submission failed. Please try again.'}
											</div>
										</div>
									)}
									
									{submissionResult.status === 'Accepted' && (
										<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
											{submissionResult.runtime && (
												<div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 shadow-lg">
													<div className="flex items-center mb-3">
														<span className="text-xl mr-2">⚡</span>
														<span className="text-gray-400 text-sm font-medium uppercase tracking-wide">Runtime</span>
													</div>
													<div className="text-white text-2xl font-bold mb-1">{submissionResult.runtime}</div>
													{submissionResult.runtime_percentile && (
														<div className="flex items-center">
															<div className="text-green-400 text-sm font-medium">
																🚀 Beats {submissionResult.runtime_percentile}% of users
															</div>
														</div>
													)}
												</div>
											)}
											{submissionResult.memory && (
												<div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 shadow-lg">
													<div className="flex items-center mb-3">
														<span className="text-xl mr-2">💾</span>
														<span className="text-gray-400 text-sm font-medium uppercase tracking-wide">Memory</span>
													</div>
													<div className="text-white text-2xl font-bold mb-1">{submissionResult.memory}</div>
													{submissionResult.memory_percentile && (
														<div className="flex items-center">
															<div className="text-purple-400 text-sm font-medium">
																🎯 Beats {submissionResult.memory_percentile}% of users
															</div>
														</div>
													)}
												</div>
											)}
											<div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700/50 hover:border-cyan-500/30 transition-all duration-300 shadow-lg">
												<div className="flex items-center mb-3">
													<span className="text-xl mr-2">🔧</span>
													<span className="text-gray-400 text-sm font-medium uppercase tracking-wide">Language</span>
												</div>
												<div className="text-white text-2xl font-bold mb-1">{submissionResult.lang || 'JavaScript'}</div>
												<div className="text-cyan-400 text-sm font-medium">✨ Compiled Successfully</div>
											</div>
										</div>
									)}

									{submissionResult.total_testcases && (
										<div className="mt-8">
											<div className="flex items-center mb-4">
												<span className="text-2xl mr-3">📋</span>
												<h3 className="text-xl font-bold text-white">Test Case Results</h3>
											</div>
											<div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl p-6 border border-gray-700/50 shadow-lg backdrop-blur-sm">
												{submissionResult.status === 'Accepted' ? (
													<div className="flex items-center justify-center p-4 bg-green-900/30 rounded-xl border border-green-500/30">
														<span className="text-2xl mr-3">🎯</span>
														<div>
															<div className="text-green-300 text-lg font-bold">Perfect Score!</div>
															<div className="text-green-400 text-sm">All {submissionResult.total_testcases} test cases passed</div>
														</div>
													</div>
												) : (
													<div>
														<div className="flex items-center p-4 bg-red-900/30 rounded-xl border border-red-500/30 mb-4">
															<span className="text-2xl mr-3">🎯</span>
															<div>
																<div className="text-red-300 text-lg font-bold">Test Case {(submissionResult.total_correct || 0) + 1} Failed</div>
																<div className="text-red-400 text-sm">{submissionResult.total_correct || 0} of {submissionResult.total_testcases} passed</div>
															</div>
														</div>
														
														{/* Show failed test case details */}
														{submissionResult.last_testcase && (
															<div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-600/50 rounded-xl p-4 shadow-inner">
																<div className="flex items-center mb-3">
																	<span className="text-lg mr-2">🔍</span>
																	<span className="text-white font-semibold">Failed Test Case Details</span>
																</div>
																<div className="space-y-4">
																	<div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
																		<div className="flex items-center mb-3">
																			<span className="text-yellow-400 mr-2">📥</span>
																			<span className="text-yellow-300 font-semibold text-sm">Input</span>
																		</div>
																		
																		{/* Parse and display individual parameters */}
																		{(() => {
																			const parsedParams = parseFailedTestInput(submissionResult.last_testcase, metaData.params.length);
																			
																			if (parsedParams.length > 0 && metaData.params.length > 0) {
																				return (
																					<div className="space-y-2">
																						{parsedParams.map((param, idx) => (
																							<div key={idx} className="flex items-start gap-3">
																								<span className="text-blue-300 font-medium min-w-0 text-sm">
																									{metaData.params[idx]?.name || `param${idx + 1}`}
																									<span className="text-gray-400 ml-1">({metaData.params[idx]?.type || 'unknown'})</span>:
																								</span>
																								<div className="font-mono text-yellow-200 bg-yellow-900/10 px-2 py-1 rounded border flex-1 text-xs">
																									{param}
																								</div>
																							</div>
																						))}
																					</div>
																				);
																			} else {
																				return (
																					<div className="font-mono text-yellow-200 bg-yellow-900/10 p-2 rounded border text-xs">
																						{submissionResult.last_testcase}
																					</div>
																				);
																			}
																		})()}
																	</div>
																	
																	{submissionResult.expected_output && (
																		<div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
																			<div className="flex items-center mb-2">
																				<span className="text-green-400 mr-2">✅</span>
																				<span className="text-green-300 font-semibold text-sm">Expected Output</span>
																			</div>
																			<div className="font-mono text-green-200 bg-green-900/10 p-2 rounded border">
																				{submissionResult.expected_output}
																			</div>
																		</div>
																	)}
																	
																	{submissionResult.code_output && (
																		<div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3">
																			<div className="flex items-center mb-2">
																				<span className="text-red-400 mr-2">❌</span>
																				<span className="text-red-300 font-semibold text-sm">Your Output</span>
																			</div>
																			<div className="font-mono text-red-200 bg-red-900/10 p-2 rounded border">
																				{submissionResult.code_output}
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
								<div className="bg-gradient-to-br from-gray-800/30 to-gray-900/50 border border-gray-600/50 rounded-xl p-8 mb-6 text-center shadow-lg backdrop-blur-sm">
									<div className="text-6xl mb-4">🚀</div>
									<div className="text-gray-300 text-xl font-semibold mb-2">Ready to Submit?</div>
									<div className="text-gray-400 mb-4">Test your solution against all LeetCode test cases</div>
									<div className="inline-flex items-center px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm">
										<span className="mr-2">💡</span>
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
