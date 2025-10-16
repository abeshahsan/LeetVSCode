function SolutionPane({ problem }) {
	return (
		<div>
			<p className="text-gray-400">Solution Viewer Component (placeholder)</p>
			<div className="mt-4 p-4 border border-gray-700 rounded bg-[#252526]">
				<pre className="text-xs text-gray-300">{`// TODO: render code snippets from:
${problem?.title || "unknown"}
// data.question.codeSnippets[] (lang, langSlug, code)`}</pre>
			</div>
		</div>
	);
}

export default SolutionPane;
