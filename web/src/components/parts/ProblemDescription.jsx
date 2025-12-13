export default function ProblemDescription({ html }) {
	return (
		<div className='flex-1 flex flex-col min-h-0'>
			<div className='flex-1 overflow-auto'>
				<div className='prose prose-invert max-w-none p-4'>
					<div
						className='leetcode-content text-gray-300 leading-relaxed'
						dangerouslySetInnerHTML={{ __html: html }}
					/>
				</div>
			</div>
		</div>
	);
}
