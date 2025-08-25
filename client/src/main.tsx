import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global handler for unhandled promise rejections (prevents runtime error overlay for aborted requests)
window.addEventListener('unhandledrejection', (event) => {
  // Check if it's an AbortError - these are expected when requests are cancelled
  if (event.reason?.name === 'AbortError') {
    console.warn('Caught unhandled AbortError - this is expected when requests are cancelled');
    event.preventDefault(); // Prevent the error from propagating
    return;
  }
  
  // Log other unhandled rejections but don't prevent them
  console.error('Unhandled promise rejection:', event.reason);
});

createRoot(document.getElementById("root")!).render(<App />);
