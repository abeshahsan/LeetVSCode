
import { useEffect, useMemo, useState } from "react";

function SolutionPane({ problem }) {
	const [lang, setLang] = useState("javascript");
	const [code, setCode] = useState("");
	const [stdin, setStdin] = useState("");
	const [running, setRunning] = useState(false);
	const [singleResult, setSingleResult] = useState(null);
	const [cases, setCases] = useState([{ id: 1, input: "", expected: "" }]);
	const [casesResult, setCasesResult] = useState(null);

	const snippets = problem?.codeSnippets || [];
	const available = useMemo(() => snippets.map(s => s.langSlug?.toLowerCase()), [snippets]);

	useEffect(() => {
		const order = ["javascript", "typescript", "python3", "python", "java", "cpp"];
		const chosen = order.map(ls => snippets.find(s => s.langSlug?.toLowerCase() === ls)).find(Boolean) || snippets[0];
		if (chosen) {
			setLang(chosen.langSlug?.toLowerCase() || "javascript");
			setCode(chosen.code || "");
		}
		if (problem?.exampleTestcases && typeof problem.exampleTestcases === 'string') {
			const example = problem.exampleTestcases.trim();
			if (example) {
				setCases([{ id: 1, input: example, expected: "" }]);
			}
		}
	}, [snippets]);

	useEffect(() => {
		const handler = (event) => {
			const msg = event.detail || event.data;
			if (msg.command === "run-result") {
				setRunning(false);
				if (Array.isArray(msg.result)) {
					// batch results
					const enriched = msg.result.map((r, idx) => {
						const expected = cases[idx]?.expected ?? "";
						const actual = (r && typeof r.stdout === 'string') ? r.stdout : String(r?.returnValue ?? "");
						const pass = actual.trim() === String(expected).trim();
						return { ...r, expected, actual, pass };
					});
					setCasesResult(enriched);
				} else {
					setSingleResult({ type: "ok", data: msg.result });
				}
			} else if (msg.command === "run-error") {
				setRunning(false);
				setSingleResult({ type: "err", error: msg.error });
			}
		};
		window.addEventListener("vscode-message", handler);
		return () => window.removeEventListener("vscode-message", handler);
	}, [cases]);

	const onRun = () => {
		if (!window.vscode) return;
		setRunning(true);
		setSingleResult(null);
		setCasesResult(null);
		window.vscode.postMessage({
			command: "run-code",
			payload: { language: lang, code, mode: "script", stdin }
		});
	};

	const onRunCases = () => {
		if (!window.vscode || cases.length === 0) return;
		setRunning(true);
		setSingleResult(null);
		setCasesResult(null);
		const testcases = cases.map(c => ({ stdin: c.input }));
		window.vscode.postMessage({
			command: "run-code",
			payload: { language: lang, code, mode: "script", testcases }
		});
	};

	const addCase = () => setCases(prev => [...prev, { id: Date.now(), input: "", expected: "" }]);
	const removeCase = (id) => setCases(prev => prev.filter(c => c.id !== id));
	const updateCase = (id, field, value) => setCases(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-2">
				<label className="text-sm text-gray-400">Language:</label>
				<select className="bg-gray-800 text-gray-200 text-sm px-2 py-1 rounded border border-gray-700" value={lang} onChange={e => setLang(e.target.value)}>
					{available.length === 0 && <option value="javascript">javascript</option>}
					{snippets.map(s => (
						<option key={s.langSlug} value={s.langSlug.toLowerCase()}>{s.lang}</option>
					))}
				</select>

				<div className="ml-auto flex gap-2">
					<button onClick={onRun} disabled={running} className={`px-3 py-1 rounded ${running ? "bg-gray-700" : "bg-blue-600 hover:bg-blue-500"} text-white text-sm`}>
						{running ? "Running…" : "Run"}
					</button>
					<button onClick={onRunCases} disabled={running || cases.length === 0} className={`px-3 py-1 rounded ${running ? "bg-gray-700" : "bg-emerald-600 hover:bg-emerald-500"} text-white text-sm`}>
						{running ? "Running…" : "Run Testcases"}
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
				<div className="flex flex-col">
					<label className="text-xs text-gray-400 mb-1">Code</label>
					<textarea className="font-mono bg-[#1b1b1b] text-gray-200 p-3 rounded border border-gray-700 min-h-[280px]" value={code} onChange={e => setCode(e.target.value)} spellCheck={false} />
				</div>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col">
						<label className="text-xs text-gray-400 mb-1">Input (stdin)</label>
						<textarea className="font-mono bg-[#1b1b1b] text-gray-200 p-3 rounded border border-gray-700 min-h-[100px]" placeholder="Optional input for your program" value={stdin} onChange={e => setStdin(e.target.value)} spellCheck={false} />
					</div>

					<div className="flex flex-col">
						<div className="flex items-center justify-between">
							<label className="text-xs text-gray-400">Testcases</label>
							<button onClick={addCase} className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white">Add</button>
						</div>
						<div className="mt-2 flex flex-col gap-2 max-h-60 overflow-auto pr-1">
							{cases.map(c => (
								<div key={c.id} className="border border-gray-700 rounded p-2 bg-[#151515]">
									<div className="flex items-center justify-between text-xs text-gray-400 mb-1">
										<span>Case</span>
										<button onClick={() => removeCase(c.id)} className="text-red-400 hover:text-red-300">Remove</button>
									</div>
									<div className="grid grid-cols-2 gap-2">
										<div className="flex flex-col">
											<span className="text-[11px] text-gray-500">Input</span>
											<textarea className="font-mono bg-[#1b1b1b] text-gray-200 p-2 rounded border border-gray-700 min-h-[60px]" value={c.input} onChange={e => updateCase(c.id, 'input', e.target.value)} spellCheck={false} />
										</div>
										<div className="flex flex-col">
											<span className="text-[11px] text-gray-500">Expected (compare to stdout)</span>
											<textarea className="font-mono bg-[#1b1b1b] text-gray-200 p-2 rounded border border-gray-700 min-h-[60px]" value={c.expected} onChange={e => updateCase(c.id, 'expected', e.target.value)} spellCheck={false} />
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="flex flex-col">
						<label className="text-xs text-gray-400 mb-1">Result</label>
						<div className="bg-[#111] rounded border border-gray-800 p-3 min-h-[120px]">
							{!singleResult && !casesResult && <p className="text-gray-500 text-sm">No run yet.</p>}
							{singleResult?.type === "ok" && (
								<pre className="text-xs text-gray-300 whitespace-pre-wrap">{JSON.stringify(singleResult.data, null, 2)}</pre>
							)}
							{singleResult?.type === "err" && (
								<pre className="text-xs text-red-400 whitespace-pre-wrap">{String(singleResult.error)}</pre>
							)}
							{Array.isArray(casesResult) && (
								<div className="text-xs">
									<div className="mb-2 text-gray-300">Passed {casesResult.filter(r => r.pass).length}/{casesResult.length}</div>
									<div className="flex flex-col gap-2 max-h-56 overflow-auto">
										{casesResult.map((r, idx) => (
											<div key={idx} className={`rounded border p-2 ${r.pass ? 'border-emerald-700 bg-emerald-900/20' : 'border-red-700 bg-red-900/20'}`}>
												<div className="font-semibold mb-1 {r.pass ? 'text-emerald-300' : 'text-red-300'}">Case {idx + 1}: {r.pass ? 'Accepted' : 'Rejected'}</div>
												<div className="grid grid-cols-2 gap-2">
													<div>
														<div className="text-gray-400">Stdout</div>
														<pre className="whitespace-pre-wrap text-gray-200">{String(r.stdout ?? '')}</pre>
													</div>
													<div>
														<div className="text-gray-400">Expected</div>
														<pre className="whitespace-pre-wrap text-gray-200">{String(r.expected ?? '')}</pre>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default SolutionPane;
