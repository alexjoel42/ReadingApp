import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary } from 'react-error-boundary';

// Enhanced error boundary component
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert" style={{
      padding: '20px',
      backgroundColor: '#fee2e2',
      color: '#b91c1c',
      border: '1px solid #fca5a5',
      borderRadius: '4px',
      fontFamily: 'sans-serif'
    }}>
      <h2>Something went wrong:</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{error.message}</pre>
      <p>Check the browser console for more details.</p>
    </div>
  );
}

// Debugging function to check environment
function checkEnvironment() {
  const envInfo = {
    NODE_ENV: import.meta.env.MODE,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
    BASE_URL: import.meta.env.BASE_URL,
    isProduction: import.meta.env.PROD,
    isDevelopment: import.meta.env.DEV
  };
  console.log('Environment Info:', envInfo);
}

// Main mounting function with error handling
function mountApp() {
  try {
    checkEnvironment();
    
    const rootElement = document.getElementById('root');
    
    if (!rootElement) {
      // Create a fallback UI if root element is missing
      const fallbackElement = document.createElement('div');
      fallbackElement.id = 'root';
      fallbackElement.style.padding = '20px';
      fallbackElement.style.color = 'red';
      fallbackElement.innerHTML = `
        <h1>Application Error</h1>
        <p>Root element (#root) not found in DOM.</p>
        <p>Check your index.html file.</p>
      `;
      document.body.appendChild(fallbackElement);
      throw new Error('Root element (#root) not found in DOM');
    }

    // Verify React is properly imported
    if (typeof React === 'undefined' || typeof createRoot === 'undefined') {
      throw new Error('React dependencies not properly imported');
    }

    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );

    console.log('Application mounted successfully');
  } catch (error) {
    console.error('Fatal error mounting application:', error);
    
    // Display error in DOM if possible
    const errorElement = document.createElement('div');
    errorElement.style.padding = '20px';
    errorElement.style.color = 'red';
    errorElement.innerHTML = `
      <h1>Fatal Application Error</h1>
      <pre>${(error as Error).message}</pre>
      <p>Check console for details.</p>
    `;
    document.body.appendChild(errorElement);
  }
}

// Initialize the app
mountApp();