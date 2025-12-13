import { useState, useEffect, useMemo } from "react";
import TestRunnerPane from "./test-runner-pane";
import { parseMetaData } from "../utils/ui.js";
import TabsHeader from "./parts/TabsHeader";
import ProblemHeader from "./parts/ProblemHeader";
import ProblemDescription from "./parts/ProblemDescription";
import SubmissionPane from "./parts/SubmissionPane";

function ProblemPane({ problem }) {
	const [activeTab, setActiveTab] = useState("description");
	const [tabs, setTabs] = useState([{ id: "description", label: "Description", closable: false }]);
	const [submissionResult, setSubmissionResult] = useState(null);
	const [submissionLoading, setSubmissionLoading] = useState(false);

	const metaData = useMemo(() => parseMetaData(problem), [problem]);

	const html = problem?.content || "<p class='text-gray-400'>No description available.</p>";

	const openSubmissionTab = () => {
		const submissionTab = { id: "submission", label: "Submission", closable: true };
		if (!tabs.find((tab) => tab.id === "submission")) {
			setTabs((prev) => [...prev, submissionTab]);
		}
		setActiveTab("submission");
		setSubmissionLoading(true);
	};

	const handleSubmit = () => {
		const selected = window.__SELECTED_LANG__ || problem?.defaultLanguage || "cpp";
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
			<TabsHeader tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} onCloseTab={closeTab} />

			{/* Tab Content */}
			<div className='flex-1 overflow-hidden'>
				{activeTab === "description" && (
					<div className='h-full flex flex-col'>
						{/* Problem Header Section */}
						<ProblemHeader problem={problem} />

						{/* Problem Description */}
						<ProblemDescription html={html} />

						{/* Test Runner Section */}
						<div className='border-t border-gray-800 bg-[#0f0f0f]'>
							<TestRunnerPane problem={problem} onSubmit={handleSubmit} isSubmitting={submissionLoading} />
						</div>
					</div>
				)}

				{activeTab === "submission" && (
					<SubmissionPane
						submissionLoading={submissionLoading}
						submissionResult={submissionResult}
						metaData={metaData}
					/>
				)}
			</div>
		</div>
	);
}

export default ProblemPane;
