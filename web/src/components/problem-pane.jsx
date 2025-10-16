function ProblemPane({ problem }) {
	const html = problem?.content || "<p class='text-gray-400'>No description available.</p>";
	return (
		<div className="prose prose-invert max-w-none">
			<h2 className="text-white mb-3">{problem?.title || "Problem"}</h2>
			<div className="border border-gray-800 rounded p-4 bg-[#161616]">
				<div dangerouslySetInnerHTML={{ __html: html }} />
			</div>
		</div>
	);
}

export default ProblemPane;
