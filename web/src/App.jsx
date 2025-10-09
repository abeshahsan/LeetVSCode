import { useEffect, useState, useCallback } from "react";
import useFetch from "./hooks/useFetch";

function App() {
	const [items, setItems] = useState([]);
	const { fetchData, loading, error } = useFetch();

	const load = useCallback(async () => {
		try {
			const result = await fetchData("http://localhost:3000/problems");
			// if API returns an array, use it; if it returns object with data prop, handle that
			setItems(Array.isArray(result) ? result : result.data || []);
		} catch (err) {
			console.error("Fetch failed:", err);
		}
	}, [fetchData]);

	useEffect(() => {
		load();
	}, [load]);

	return (
		<div className='p-6 max-w-3xl mx-auto'>
			<div className='flex items-center justify-between mb-4'>
				<h1 className='text-2xl font-bold'>Problems</h1>
				<button
					onClick={load}
					disabled={loading}
					className='bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1 rounded'
				>
					{loading ? "Loading..." : "Refresh"}
				</button>
			</div>

			{error && (
				<div className='mb-4 p-3 bg-red-100 text-red-800 rounded'>Error: {error.message || String(error)}</div>
			)}

			<div className='h-96 overflow-y-auto border border-gray-200 rounded'>
				{items.length === 0 ? (
					<div className='p-4 text-gray-500'>No items</div>
				) : (
					<ul className='divide-y divide-gray-100'>
						{items.map((item, idx) => {
							const id = item.questionFrontendId ?? item.id ?? idx;
							const title = item.title || item.titleSlug || item.questionTitle || item.questionTitleSlug || item.name || `#${id}`;
							const difficulty = item.difficulty || item.difficultyLevel || (item.stat && item.stat.difficulty) || 'Unknown';
							const acRate = item.acRate ?? (item.stat && item.stat.acRate) ?? null;
							const tags = item.topicTags || item.topic_tags || item.tags || [];

							return (
								<li key={id} className='p-4 hover:bg-gray-50'>
									<div className='flex items-center justify-between'>
										<div className='font-semibold text-gray-800'>{title}</div>
										<div className='text-sm text-gray-600'>{difficulty}</div>
									</div>
									<div className='text-sm text-gray-500 mt-1'>ID: {id} {acRate ? `• AC: ${Number(acRate).toFixed(1)}%` : null}</div>
									{Array.isArray(tags) && tags.length > 0 && (
										<div className='mt-2 flex flex-wrap gap-2'>
											{tags.map((t, i) => (
												<span key={t.name ?? t.slug ?? i} className='text-xs bg-gray-100 px-2 py-1 rounded'>{t.name || t.slug || t}</span>
											))}
										</div>
									)}
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
}

export default App;
