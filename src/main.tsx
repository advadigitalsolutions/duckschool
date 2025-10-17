import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BionicReadingProvider } from "./contexts/BionicReadingContext";

createRoot(document.getElementById("root")!).render(
  <BionicReadingProvider>
    <App />
  </BionicReadingProvider>
);
