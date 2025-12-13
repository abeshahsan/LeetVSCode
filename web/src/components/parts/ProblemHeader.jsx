import { getStatusClass, getLikePercentage } from "../../utils/ui.js";

function computeStatus(problem) {
	return problem?.status === "ac" ? "Solved" : problem?.status === "notac" ? "Attempted" : "";
}

export default function ProblemHeader({ problem }) {
	const status = computeStatus(problem);
	const likes = problem?.likes || 0;
	const dislikes = problem?.dislikes || 0;
	const likePct = getLikePercentage(likes, dislikes);

	return (
		<div className='border-b border-blue-500/20 p-5 bg-gradient-to-br from-slate-900/60 via-blue-900/20 to-purple-900/20 backdrop-blur-sm'>
			{/* Status Badge */}
			<div className='flex items-center justify-between'>
				<div />
				<div className='flex items-center gap-2'>
					<span
						className={`px-3 py-1.5 text-xs font-bold rounded-lg border shadow-lg ${
							status === "Solved"
								? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50 text-green-300"
								: status === "Attempted"
								? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/50 text-yellow-300"
								: "bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-400/50 text-gray-300"
						} ${getStatusClass(status)}`}
					>
						{status}
					</span>
				</div>
			</div>

			{/* Stats Row */}
			<div className='flex items-center gap-6 text-sm mt-3'>
				{problem?.acRate && (
					<div className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30'>
						<span className='text-green-400 text-base'>✓</span>
						<span className='text-green-300 font-semibold'>
							{parseFloat(problem.acRate).toFixed(1)}%
						</span>
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
	);
}
