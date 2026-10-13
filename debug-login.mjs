import http from "node:http";

const email = process.env.ADMIN_EMAIL || "admin@ruangketua.id";
const passwords = (process.env.DEBUG_LOGIN_PASSWORDS || process.env.ADMIN_PASSWORD || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (passwords.length === 0) {
  throw new Error("Set ADMIN_PASSWORD atau DEBUG_LOGIN_PASSWORDS sebelum menjalankan debug-login.mjs.");
}

async function tryLogin(password) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ email, password });
    const options = {
      hostname: "localhost", port: 3000,
      path: "/api/admin/auth", method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, body: data, cookie: res.headers["set-cookie"] }));
    });
    req.on("error", (e) => resolve({ status: 0, body: e.message }));
    req.write(body);
    req.end();
  });
}

for (const pw of passwords) {
  const r = await tryLogin(pw);
  console.log(`[${pw}] -> ${r.status} ${r.body.substring(0, 60)}`);
  if (r.status === 200) { console.log("COOKIE:", r.cookie); break; }
}
