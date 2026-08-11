import React from 'react';
import ReactDOM from 'react-dom/client';
import { PostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js';
import App from './App';
import './index.css';

posthog.init('phc_kpUWTjEcRRwSn7zdNstbDVYqAMQvEFZ5EgrWFeaAh5mu', {
  api_host: 'https://us.i.posthog.com',
  defaults: '2026-01-30',
  person_profiles: 'identified_only',
  capture_pageview: false,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </React.StrictMode>
);
