import { useState, useCallback } from 'react';

const useFetch = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback((url, options = {}) => {
        return new Promise((resolve, reject) => {
            if (!window.vscode) {
                const errorMsg = 'VS Code API not available';
                setError(errorMsg);
                reject(new Error(errorMsg));
                return;
            }

            const requestId = Date.now().toString();
            setLoading(true);
            setError(null);

            const handleMessage = (event) => {
                const message = event.detail;
                
                if (message && message.requestId === requestId) {
                    window.removeEventListener('vscode-message', handleMessage);
                    setLoading(false);
                    
                    if (message.command === 'fetchResponse') {
                        resolve(message.data);
                    } else if (message.command === 'fetchError') {
                        const errorObj = new Error(message.error);
                        setError(errorObj);
                        reject(errorObj);
                    }
                }
            };

            window.addEventListener('vscode-message', handleMessage);

            // Send fetch request to extension
            window.vscode.postMessage({
                command: 'fetch',
                requestId: requestId,
                url: url,
                method: options.method || 'GET',
                headers: options.headers,
                body: options.body
            });
        });
    }, []);

    return { fetchData, loading, error };
};

export default useFetch;