import { useEffect, useMemo, useState } from "react";
import { getDifficultyStyles } from "../utils/ui.js";
import ProblemPane from "./problem-pane";

export default function ProblemSession({ data, onBack }) {
	const problem = data?.question;
	const defaultLanguage = data?.defaultLanguage; // From VS Code settings
	const codeSnippets = useMemo(() => problem?.codeSnippets || [], [problem?.codeSnippets]);
	
	const defaultLang = useMemo(() => {
		// Use VS Code settings default language if available
		if (defaultLanguage) {
			const found = codeSnippets.find((c) => c.langSlug === defaultLanguage);
			if (found) {
				return defaultLanguage;
			}
		}
		// Fallback: just use first available
		return codeSnippets[0]?.langSlug;
	}, [codeSnippets, defaultLanguage]);
	
	const [langSlug, setLangSlug] = useState(defaultLang);
	
	// Update langSlug when defaultLang changes
	useEffect(() => {
		if (defaultLang) {
			setLangSlug(defaultLang);
		}
	}, [defaultLang]);

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
			// Failed to post message
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
			<div className='flex items-center justify-between p-4 border-b border-blue-500/20 bg-gradient-to-r from-slate-900/95 via-blue-900/20 to-purple-900/20 backdrop-blur-sm shadow-xl'>
				<div className='flex items-center gap-4'>
					{onBack && (
						<button
							onClick={onBack}
							className='text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-slate-700 to-slate-600 hover:from-blue-600 hover:to-cyan-600 border border-slate-500/50 hover:border-blue-400/50 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-blue-500/30 hover:scale-105'
						>
							← Back
						</button>
					)}
					<div className='flex items-center gap-3'>
						<h2 className='text-xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent'>
							{problem?.questionFrontendId ? `${problem.questionFrontendId}. ` : ""}
							{problem?.title || "Problem"}
						</h2>
						{problem?.difficulty && (
							<span
								className={`px-3 py-1.5 text-xs font-bold rounded-full border shadow-lg ${getDifficultyStyles(
									problem.difficulty
								)}`}
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
							<label className='text-sm text-cyan-400 font-semibold'>Language:</label>
							<select
								className='bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/40 text-cyan-100 text-sm rounded-lg px-4 py-2 min-w-[120px] focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all duration-300 shadow-lg hover:shadow-cyan-500/30 font-medium cursor-pointer'
								value={langSlug || ""}
								onChange={(e) => {
									const val = e.target.value;
									setLangSlug(val);
									openSolutionFile(val);
									try {
										window.__SELECTED_LANG__ = val;
									} catch (e) {
										// Failed to set language preference
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
