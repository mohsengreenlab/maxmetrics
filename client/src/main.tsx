import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global handler for unhandled promise rejections (prevents runtime error overlay for aborted requests)
window.addEventListener('unhandledrejection', (event) => {
  console.log('🔥 Unhandled rejection detected:', {
    reason: event.reason,
    reasonName: event.reason?.name,
    reasonMessage: event.reason?.message,
    stack: event.reason?.stack
  });
  
  // Check if it's an AbortError or related to cancelled requests
  if (event.reason?.name === 'AbortError' || 
      event.reason?.message?.includes('aborted') ||
      event.reason?.message?.includes('cancelled') ||
      event.reason?.message?.includes('Request was cancelled')) {
    console.warn('🛑 Preventing AbortError from showing error overlay');
    event.preventDefault(); // Prevent the error from propagating
    return;
  }
  
  // Log other unhandled rejections but don't prevent them
  console.error('💥 Unhandled promise rejection (not prevented):', event.reason);
});

createRoot(document.getElementById("root")!).render(<App />);
