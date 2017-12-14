const express = require("express");
const app = express();
const fs = require("fs");
const EventEmitter = require("events").EventEmitter;
const ee1 = new EventEmitter();
let count = 0;
setInterval(() => {
  count += 1;
  ee1.emit("event-stream", { msg: "open", count });
}, 500);

app.use(express.json({ limit: "10mb" }));
// app.use(express.static("./public"));

// app.use((req, res, next) => {
//   req.body = "";
//   req.on("data", raw => {
//     req.body += raw;
//   });

//   req.on("end", () => {
//     try {
//       req.body = JSON.parse(req.body);
//     } catch (e) {
//       next(e);
//     }
//     next();
//   });
// });

app.use((req, res, next) => {
  req.conn = { close: () => ({}) };
  if (req.method === "POST") console.log(req.method);
  next();
  req.conn.close();
});

app.get("/", (req, res, next) => {
  res.send("Hello World");
});

app.get("/data", (req, res, next) => {
  fs.createReadStream("./public/foo.json").pipe(res);
});

app.post("/eventstream", (req, res, next) => {
  ee1.emit("event-stream", { ...req.body, msg: "from post" });
  res.sendStatus(202);
});
app.get("/eventstream", (req, res, next) => {
  res.setHeader("Transfer-Encoding", "chunked");
  ee1.on("event-stream", evt => {
    res.write(`${JSON.stringify(evt)}\n`);
  });
  res.write("\n");
});

app.get("/users", (req, res) => {
  res.send("Demo");
});

app.post("/users", (req, res) => {
  console.log(req.body);
  res.send(req.body);
});

app.get("/users/:id", (req, res) => {
  res.send("Demo " + req.params.id + " " + req.query.foo);
});

app.post("/", (req, res) => {
  console.log(req.body);
  res.send("Foo Bar");
});

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).send(err.message);
});

let server = null;
module.exports = {
  port: () => server && server.address().port,
  start,
  stop: callback => {
    server.close(callback);
  }
};

function start(port, callback) {
  server = app.listen(port, null, callback);
}
