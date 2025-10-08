// app.js — Node.js backend for Server 2
const http = require("http");

// In-memory dictionary (array of objects)
const dictionary = [];
let requestCount = 0;

const server = http.createServer((req, res) => {
  // Increment total request count
  requestCount++;

  // Set common headers for JSON + CORS
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow requests from any origin
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse the URL and query
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Endpoint: /api/definitions
  if (pathname === "/api/definitions") {
    if (req.method === "GET") {
      // Handle GET request — search for a word
      const word = url.searchParams.get("word");

      if (!word || !/^[a-zA-Z]+$/.test(word)) {
        res.writeHead(400);
        res.end(
          JSON.stringify({
            message: "Invalid or missing word parameter.",
            requestCount,
          })
        );
        return;
      }

      const entry = dictionary.find(
        (item) => item.word.toLowerCase() === word.toLowerCase()
      );

      if (entry) {
        res.writeHead(200);
        res.end(
          JSON.stringify({
            word: entry.word,
            definition: entry.definition,
            requestCount,
          })
        );
      } else {
        res.writeHead(404);
        res.end(
          JSON.stringify({
            message: `Word "${word}" not found.`,
            requestCount,
          })
        );
      }
    } 
    else if (req.method === "POST") {
      // Handle POST request — add a new word
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          const { word, definition } = data;

          if (!word || !definition || !/^[a-zA-Z]+$/.test(word)) {
            res.writeHead(400);
            res.end(
              JSON.stringify({
                message: "Invalid input. Please provide a valid word and definition.",
                requestCount,
              })
            );
            return;
          }

          const existing = dictionary.find(
            (item) => item.word.toLowerCase() === word.toLowerCase()
          );

          if (existing) {
            res.writeHead(409); // Conflict
            res.end(
              JSON.stringify({
                message: `Warning! "${word}" already exists.`,
                requestCount,
                totalEntries: dictionary.length,
              })
            );
          } else {
            dictionary.push({ word, definition });

            res.writeHead(201);
            res.end(
              JSON.stringify({
                message: `New entry recorded: "${word}" : "${definition}"`,
                requestCount,
                totalEntries: dictionary.length,
              })
            );
          }
        } catch (error) {
          res.writeHead(400);
          res.end(
            JSON.stringify({
              message: "Invalid JSON in request body.",
              requestCount,
            })
          );
        }
      });
    } 
    else {
      // Unsupported method
      res.writeHead(405);
      res.end(JSON.stringify({ message: "Method Not Allowed", requestCount }));
    }
  } else {
    // Invalid endpoint
    res.writeHead(404);
    res.end(JSON.stringify({ message: "Endpoint Not Found", requestCount }));
  }
});

// Choose your own port (e.g. 8080 or 3000)
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
