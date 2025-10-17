function ProblemPane({ problem }) {
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

	return (
		<div className="h-full flex flex-col bg-[#0a0a0a]">
			{/* Header Section */}
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

			{/* Content Section */}
			<div className="flex-1 overflow-auto">
				<div className="prose prose-invert max-w-none p-4">
					<div 
						className="leetcode-content text-gray-300 leading-relaxed"
						dangerouslySetInnerHTML={{ __html: html }} 
					/>
				</div>
			</div>
		</div>
	);
}

export default ProblemPane;
