import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BionicReadingProvider } from "./contexts/BionicReadingContext";

// TEMPORARY: Update micro-fiction lesson with complete content
// Remove this import after the lesson has been successfully updated
import "./utils/updateLesson";

createRoot(document.getElementById("root")!).render(
  <BionicReadingProvider>
    <App />
  </BionicReadingProvider>
);
