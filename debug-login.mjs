const http = require("http");

async function tryLogin(password) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ email: "admin@ruangketua.my.id", password });
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

const passwords = ["admin", "admin123", "password", "123456", "ruangketua", "Admin123", "admin@123", "ketuakelas", "admin1234", "admin@ruangketua"];
for (const pw of passwords) {
  const r = await tryLogin(pw);
  console.log(`[${pw}] -> ${r.status} ${r.body.substring(0, 60)}`);
  if (r.status === 200) { console.log("COOKIE:", r.cookie); break; }
}
