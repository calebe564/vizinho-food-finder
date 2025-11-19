import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { LocationProvider } from "./contexts/LocationContext";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.log('Service Worker registration failed:', error);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <LocationProvider>
    <App />
  </LocationProvider>
);
