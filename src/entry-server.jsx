import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext';

export function render(path) {
  return renderToString(<ThemeProvider><App path={path} /></ThemeProvider>);
}
