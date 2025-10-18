import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BionicReadingProvider } from "./contexts/BionicReadingContext";
import { TutorialProvider } from "./contexts/TutorialContext";

createRoot(document.getElementById("root")!).render(
  <BionicReadingProvider>
    <TutorialProvider>
      <App />
    </TutorialProvider>
  </BionicReadingProvider>
);
