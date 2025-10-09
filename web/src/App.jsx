import { useState } from 'react';
import useFetch from './hooks/useFetch';

function App() {
    const [data, setData] = useState(null);
    const { fetchData, loading, error } = useFetch();

    const handleFetch = async () => {
        try {
            const result = await fetchData('https://jsonplaceholder.typicode.com/posts/1');
            setData(result);
        } catch (err) {
            console.error('Fetch failed:', err);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-lg">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">VS Code Extension Demo</h1>
            
            <button 
                onClick={handleFetch} 
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
                {loading ? 'Loading...' : 'Fetch Data'}
            </button>
            
            {error && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <strong>Error:</strong> {error.message}
                </div>
            )}
            
            {data && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">{data.title}</h2>
                    <p className="text-gray-600 leading-relaxed">{data.body}</p>
                </div>
            )}
        </div>
    );
}

export default App;