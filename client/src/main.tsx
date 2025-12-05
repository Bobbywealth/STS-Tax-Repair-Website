import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "@/hooks/usePWA";

registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
