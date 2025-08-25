import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global handler for unhandled promise rejections (prevents runtime error overlay for aborted requests)
window.addEventListener('unhandledrejection', (event) => {
  // Check if it's an AbortError, CancelledError, or related to cancelled requests
  if (event.reason?.name === 'AbortError' || 
      event.reason?.name === 'CancelledError' ||
      event.reason?.message?.includes('aborted') ||
      event.reason?.message?.includes('cancelled') ||
      event.reason?.message?.includes('Request was cancelled') ||
      event.reason?.message?.includes('operation was aborted')) {
    event.preventDefault(); // Prevent the error from propagating
    return;
  }
  
  // Also handle timeout errors
  if (event.reason?.message?.includes('timeout') ||
      event.reason?.message?.includes('Request timeout')) {
    event.preventDefault();
    return;
  }
  
  // Log other unhandled rejections for debugging
  console.error('Unhandled promise rejection:', event.reason);
});

createRoot(document.getElementById("root")!).render(<App />);
