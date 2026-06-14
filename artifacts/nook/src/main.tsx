import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { setBaseUrl } from "../../../lib/api-client-react/src/custom-fetch";

setBaseUrl("https://workspaceapi-server-production-ac11.up.railway.app");

createRoot(document.getElementById("root")!).render(<App />);