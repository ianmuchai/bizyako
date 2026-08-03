"use strict";

const { createBizYakoServer } = require("./server");

const port = Number(process.env.PORT) || 5173;
const server = createBizYakoServer();

server.listen(port, () => {
  console.log("BizYako frontend and backend running on port " + port);
});

module.exports = server;
