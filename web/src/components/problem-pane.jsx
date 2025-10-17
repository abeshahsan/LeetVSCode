import { useState } from 'react';
import TestRunnerPane from './test-runner-pane';

function ProblemPane({ problem }) {
	const [activeTab, setActiveTab] = useState('description');
	const [tabs, setTabs] = useState([
		{ id: 'description', label: 'Description', closable: false }
	]);

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
	};

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
							<div className="flex items-center justify-between mb-3">
								<h1 className="text-xl font-semibold text-white">
									{problem?.frontendQuestionId}. {problem?.title || "Problem"}
								</h1>
								<div className="flex items-center gap-2">
									{problem?.difficulty && (
										<span className={`px-2 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(problem.difficulty)}`}>
											{problem.difficulty}
										</span>
									)}
								</div>
							</div>
							
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
								<TestRunnerPane problem={problem} onSubmit={openSubmissionTab} />
							</div>
						</div>
					</div>
				)}

				{activeTab === 'submission' && (
					<div className="h-full p-4 bg-[#0a0a0a] overflow-auto">
						<div className="text-center">
							<h2 className="text-xl font-semibold text-white mb-4">Submission Results</h2>
							<div className="bg-green-900/20 border border-green-700 rounded-lg p-6 mb-4">
								<div className="text-green-400 text-lg font-medium mb-2">✓ Accepted</div>
								<div className="text-gray-300">Your solution has been successfully submitted!</div>
							</div>
							
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
								<div className="bg-gray-800 rounded-lg p-4">
									<div className="text-gray-400 text-sm">Runtime</div>
									<div className="text-white text-lg font-semibold">72 ms</div>
									<div className="text-green-400 text-sm">Beats 85.7% of users</div>
								</div>
								<div className="bg-gray-800 rounded-lg p-4">
									<div className="text-gray-400 text-sm">Memory</div>
									<div className="text-white text-lg font-semibold">42.3 MB</div>
									<div className="text-green-400 text-sm">Beats 92.1% of users</div>
								</div>
								<div className="bg-gray-800 rounded-lg p-4">
									<div className="text-gray-400 text-sm">Language</div>
									<div className="text-white text-lg font-semibold">JavaScript</div>
									<div className="text-gray-400 text-sm">Runtime Distribution</div>
								</div>
							</div>

							<div className="mt-6 text-left">
								<h3 className="text-lg font-medium text-white mb-3">Test Cases Passed</h3>
								<div className="bg-gray-800 rounded-lg p-4">
									<div className="text-green-400 mb-2">✓ All test cases passed (1337/1337)</div>
									<div className="text-gray-400 text-sm">
										<div>• Basic test cases: Passed</div>
										<div>• Edge cases: Passed</div>
										<div>• Performance tests: Passed</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default ProblemPane;
