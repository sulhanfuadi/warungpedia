import http from "node:http";

const REPORT_URL = "http://localhost:3000/api/admin/sellers/report?status=ALL&format=pdf";

console.log("Starting PDF test...");

const req = http.get(REPORT_URL, (res) => {
  console.log("Response received!");
  console.log("Status Code:", res.statusCode);
  console.log("Content-Type:", res.headers["content-type"]);

  let totalSize = 0;
  res.on("data", (chunk: Buffer) => {
    totalSize += chunk.length;
    console.log("Chunk:", chunk.length, "bytes, total so far:", totalSize);
  });

  res.on("end", () => {
    console.log("Response ended, total:", totalSize, "bytes");
    process.exit(0);
  });
});

req.on("error", (err: NodeJS.ErrnoException) => {
  console.error("Request error:", err.code ?? "UNKNOWN", err.message);
  process.exit(1);
});

req.on("timeout", () => {
  console.error("Request timeout");
  process.exit(1);
});

req.setTimeout(10_000);
