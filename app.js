import { createServer } from "http";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { codex } from "./codex.js";

const PORT = 1050;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function serveStaticFile(filePath, contentType, res) {
  readFile(filePath)
    .then((data) => {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    })
    .catch((error) => {
      console.error(`Error reading file ${filePath}: ${error}`);
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    });
}


function getAutocompleteSuggestions(query) {
  if (!query) return [];
  const lowerCaseQuery = query.toLowerCase();
  return codex.filter((item) =>
    item.infrazione.toLowerCase().includes(lowerCaseQuery)
  );
}

createServer((req, res) => {
  if (req.method === "GET") {
    if (req.url === "/") {
      serveStaticFile(path.join(__dirname, "index.html"), "text/html", res);
    } else if (req.url === "/frontend.js") {
      serveStaticFile(path.join(__dirname, "frontend.js"), "application/javascript", res);
    } else if (req.url === "/codex.js") {
      serveStaticFile(path.join(__dirname, "codex.js"), "application/javascript", res);
    } else if (req.url.startsWith("/api/autocomplete")) {
      const urlParams = new URL(req.url, `http://localhost:${PORT}`);
      const query = urlParams.searchParams.get("q");
      const suggestions = getAutocompleteSuggestions(query);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(suggestions));
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    }
  } else {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method Not Allowed");
  }
}).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
