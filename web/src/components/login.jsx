export function LoginPage() {
	return (
		<div className='flex items-center justify-center min-h-screen bg-gray-900'>
			<div className='bg-gray-800 shadow-lg rounded-lg p-8 max-w-md w-full text-center'>
				<h1 className='text-3xl font-bold mb-6 text-gray-100'>Sign In</h1>
				<button
					onClick={() => {
						if (window.vscode) {
							window.vscode.postMessage({ command: "login" });
						}
					}}
					className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold transition'
				>
					Sign In with Browser
				</button>
			</div>
		</div>
	);
}
