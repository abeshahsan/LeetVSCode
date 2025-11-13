export function LoginPage() {
	return (
		<div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950'>
			<div className='bg-gradient-to-br from-slate-800/40 to-slate-900/60 backdrop-blur-xl shadow-2xl rounded-2xl p-10 max-w-md w-full text-center border border-blue-500/20 hover:border-blue-400/40 transition-all duration-500'>
				<div className='mb-8'>
					<div className='text-6xl mb-4 animate-pulse'>🚀</div>
					<h1 className='text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent'>Sign In</h1>
					<p className='text-gray-400 text-sm'>Connect to start solving problems</p>
				</div>
				<button
					onClick={() => {
						if (window.vscode) {
							window.vscode.postMessage({ command: "login" });
						}
					}}
					className='relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:via-cyan-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/50 hover:scale-105 active:scale-95'
				>
					<span className='relative z-10'>Sign In with Browser</span>
				</button>
			</div>
		</div>
	);
}
