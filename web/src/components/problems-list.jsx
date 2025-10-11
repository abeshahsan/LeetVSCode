import React, { useEffect, useState } from "react";

export function ProblemList() {
	const [items, setItems] = useState([]);
	const [showTags, setShowTags] = useState(true);

	useEffect(() => {
		window.vscode.postMessage({ command: "fetch-problems" });

		const handler = (event) => {
			const msg = event.detail || event.data;
			if (msg.command === "problems") {
				setItems(msg.data?.problemsetQuestionList?.questions || []);
			}
		};
		window.addEventListener("vscode-message", handler);
		return () => window.removeEventListener("vscode-message", handler);
	}, []);

	const getDifficultyClass = (difficulty) => {
		switch (difficulty) {
			case "Easy":
				return "text-green-400";
			case "Medium":
				return "text-yellow-400";
			case "Hard":
				return "text-red-400";
			default:
				return "text-gray-400";
		}
	};

	return (
		<div className="p-4 bg-[#1e1e1e] text-gray-200 font-inter rounded-lg h-full flex flex-col">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-semibold text-white">
					LeetCode Problems
				</h2>

				<label className="flex items-center gap-2 text-sm text-gray-400 select-none cursor-pointer">
					<input
						type="checkbox"
						className="accent-blue-500 cursor-pointer"
						checked={!showTags}
						onChange={() => setShowTags((prev) => !prev)}
					/>
					Hide Tags
				</label>
			</div>

			<div className="overflow-y-auto max-h-[70vh] rounded-lg border border-gray-700">
				<table className="min-w-full text-sm">
					<thead className="bg-[#2d2d2d] text-gray-400 sticky top-0 z-10">
						<tr>
							<th className="py-3 px-4 text-left font-medium w-12">#</th>
							<th className="py-3 px-4 text-left font-medium">Title</th>
							<th className="py-3 px-4 text-left font-medium">Difficulty</th>
							<th className="py-3 px-4 text-left font-medium">Acceptance</th>
						</tr>
					</thead>

					<tbody>
						{items.map((q, idx) => (
							<tr
								key={q.frontendQuestionId}
								className={`border-t border-gray-800 hover:bg-[#252526] transition ${
									idx % 2 === 0 ? "bg-[#1e1e1e]" : "bg-[#222]"
								}`}
							>
								<td className="py-3 px-4 text-gray-400 align-top">
									{q.frontendQuestionId}
								</td>

								<td className="py-3 px-4">
									<a
										href={`https://leetcode.com/problems/${q.titleSlug}/`}
										target="_blank"
										rel="noreferrer"
										className="text-blue-400 hover:underline font-medium"
									>
										{q.title}
									</a>
									{q.paidOnly && <span className="ml-1 text-amber-400">🔒</span>}

									{/* Tags below title */}
									{showTags && (
										<div className="text-xs text-gray-400 mt-1">
											{q.topicTags
												.map((t) => t.name)
												.slice(0, 3)
												.join(", ")}
										</div>
									)}
								</td>

								<td
									className={`py-3 px-4 font-semibold ${getDifficultyClass(
										q.difficulty
									)}`}
								>
									{q.difficulty}
								</td>

								<td className="py-3 px-4 text-gray-400">
									{q.acRate.toFixed(1)}%
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{items.length === 0 && (
				<p className="text-center text-gray-500 mt-6">Loading problems...</p>
			)}
		</div>
	);
}
