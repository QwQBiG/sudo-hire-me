import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/tokens.css';
import './styles/layout.css';
import './styles/lesson.css';
import './styles/labs.css';
import './styles/presentation.css';
import './styles/experiments.css';
import './styles/learning-quality.css';
import './styles/home.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
