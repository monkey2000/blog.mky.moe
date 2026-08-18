import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import "katex/dist/katex.min.css";
import { App } from "./App";
import "./styles.css";

hydrateRoot(
  document.getElementById("root")!,
  <StrictMode>
    <App path={window.location.pathname} />
  </StrictMode>,
);
