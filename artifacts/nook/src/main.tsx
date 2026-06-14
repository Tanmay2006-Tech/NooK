import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { setBaseUrl } from "../../../lib/api-client-react/src/custom-fetch";

setBaseUrl("https://nook-api-ffzt.onrender.com");

createRoot(document.getElementById("root")!).render(<App />);