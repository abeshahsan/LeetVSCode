import { useEffect, useMemo, useState } from "react";
import ProblemPane from "./problem-pane";

export default function ProblemSession({ data, onBack }) {
	const problem = data?.question;
	const codeSnippets = useMemo(() => problem?.codeSnippets || [], [problem?.codeSnippets]);
	const defaultLang = useMemo(() => {
		// Prefer javascript, then python3, else first
		const pref = ["c++", "javascript", "python3", "typescript", "java"];
		for (const p of pref) {
			const found = codeSnippets.find((c) => c.langSlug === p);
			if (found) return found.langSlug;
		}
		return codeSnippets[0]?.langSlug;
	}, [codeSnippets]);
	const [langSlug, setLangSlug] = useState(defaultLang);

	// Open or create the solution file in VS Code (column two) for the current language
	function openSolutionFile(currentLang) {
		const slug = problem?.titleSlug;
		const snippet = codeSnippets.find((c) => c.langSlug === currentLang);
		if (!slug || !snippet) return;
		try {
			window.vscode?.postMessage({
				command: "open-solution-file",
				slug,
				langSlug: currentLang,
				code: snippet.code,
			});
		} catch (e) {
			// ignore
			console.warn("Failed to post open-solution-file message", e);
		}
	}

	// Initialize selection and open the file when problem changes
	useEffect(() => {
		setLangSlug(defaultLang);
		if (defaultLang) openSolutionFile(defaultLang);
		// expose selected language to other components in the webview
		try {
			window.__SELECTED_LANG__ = defaultLang;
		} catch (e) {
			console.warn("Could not set __SELECTED_LANG__", e);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [problem?.titleSlug, defaultLang]);

	return (
		<div className='h-full flex flex-col bg-[#0d1117] text-gray-200'>
			{/* Header */}
			<div className='flex items-center justify-between p-4 border-b border-gray-800 bg-[#0f1419] shadow-lg'>
				<div className='flex items-center gap-4'>
					{onBack && (
						<button
							onClick={onBack}
							className='text-sm px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-600 transition-colors flex items-center gap-2'
						>
							← Back
						</button>
					)}
					<div className='flex items-center gap-3'>
						<h2 className='text-xl font-semibold text-white'>
							{problem?.questionFrontendId ? `${problem.questionFrontendId}. ` : ""}
							{problem?.title || "Problem"}
						</h2>
						{problem?.difficulty && (
							<span
								className={`px-2 py-1 text-xs font-medium rounded-full border ${
									problem.difficulty?.toLowerCase() === "easy"
										? "text-green-500 bg-green-500/10 border-green-500/20"
										: problem.difficulty?.toLowerCase() === "medium"
										? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
										: "text-red-500 bg-red-500/10 border-red-500/20"
								}`}
							>
								{problem.difficulty}
							</span>
						)}
					</div>
				</div>

				{/* Language selector */}
				<div className='flex items-center gap-3'>
					{codeSnippets.length > 0 && (
						<>
							<label className='text-sm text-gray-400 font-medium'>Language:</label>
							<select
								className='bg-[#161b22] border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 min-w-[120px] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-colors'
								value={langSlug || ""}
								onChange={(e) => {
									const val = e.target.value;
									setLangSlug(val);
									openSolutionFile(val);
									try {
										window.__SELECTED_LANG__ = val;
									} catch (e) {
										console.warn("Could not set __SELECTED_LANG__", e);
									}
								}}
							>
								{codeSnippets.map((c) => (
									<option
										key={c.langSlug}
										value={c.langSlug}
									>
										{c.lang}
									</option>
								))}
							</select>
						</>
					)}
				</div>
			</div>

			{/* Problem pane with integrated tabs */}
			<div className='flex-1 overflow-hidden'>
				<ProblemPane problem={problem} />
			</div>
		</div>
	);
}
