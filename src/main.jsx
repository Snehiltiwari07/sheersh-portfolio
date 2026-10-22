import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

const application = (
  <React.StrictMode>
    <ThemeProvider><App /></ThemeProvider>
  </React.StrictMode>
);
const root = document.getElementById('root');
if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, application);
else ReactDOM.createRoot(root).render(application);
