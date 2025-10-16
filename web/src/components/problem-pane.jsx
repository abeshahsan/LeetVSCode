function ProblemPane({ problem }) {
	return (
		<div className="prose prose-invert max-w-none">
			<p className="text-gray-400">Problem Viewer Component (placeholder)</p>
			<div className="mt-4 p-4 border border-gray-700 rounded">
				<p className="text-sm text-gray-400">Title:</p>
				<p className="text-white font-medium">{problem?.title || "—"}</p>
			</div>
		</div>
	);
}

export default ProblemPane;
