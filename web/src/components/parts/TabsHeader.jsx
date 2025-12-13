export default function TabsHeader({ tabs, activeTab, onTabChange, onCloseTab }) {
	return (
		<div className='flex items-center border-b border-blue-500/30 bg-gradient-to-r from-slate-900/80 via-blue-900/10 to-slate-900/80 backdrop-blur-sm'>
			{tabs.map((tab) => (
				<div key={tab.id} className='flex items-center'>
					<button
						onClick={() => onTabChange(tab.id)}
						className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-300 ${
							activeTab === tab.id
								? "text-cyan-400 border-cyan-400 bg-gradient-to-t from-cyan-500/10 to-transparent shadow-lg shadow-cyan-500/20"
								: "text-gray-400 border-transparent hover:text-cyan-300 hover:border-cyan-500/50 hover:bg-slate-800/50"
						}`}
					>
						{tab.label}
					</button>
					{tab.closable && (
						<button
							onClick={() => onCloseTab(tab.id)}
							className='ml-1 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all duration-200'
						>
							&times;
						</button>
					)}
				</div>
			))}
		</div>
	);
}
