import { renderToString } from "react-dom/server";
import { App, getPageTitle } from "./App";
import { routePaths } from "./content/posts";

export { getPageTitle, routePaths };

export function render(path = "/") {
  return renderToString(<App path={path} />);
}
