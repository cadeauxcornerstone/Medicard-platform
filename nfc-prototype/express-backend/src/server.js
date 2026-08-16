import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./config/database.js";


/*
|--------------------------------------------------------------------------
| HTTP SERVER
|--------------------------------------------------------------------------
*/

const httpServer = http.createServer(app);


/*
|--------------------------------------------------------------------------
| SOCKET.IO
|--------------------------------------------------------------------------
*/

const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },

  transports: ["websocket"],
});


/*
|--------------------------------------------------------------------------
| MAKE SOCKET.IO AVAILABLE TO EXPRESS
|--------------------------------------------------------------------------
|
| Controllers can now access:
|
| const io = req.app.get("io");
|
|--------------------------------------------------------------------------
*/

app.set("io", io);


/*
|--------------------------------------------------------------------------
| SOCKET CONNECTIONS
|--------------------------------------------------------------------------
*/

io.on("connection", (socket) => {

  console.log(
    `🔌 MedCard frontend connected: ${socket.id}`
  );


  socket.on("disconnect", (reason) => {

    console.log(
      `🔌 MedCard frontend disconnected: ${socket.id} — ${reason}`
    );

  });

});


/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

const startServer = async () => {

  try {

    /*
    |--------------------------------------------------------------------------
    | PostgreSQL
    |--------------------------------------------------------------------------
    */

    await prisma.$connect();

    console.log(
      "✅ PostgreSQL connected through Prisma"
    );


    /*
    |--------------------------------------------------------------------------
    | HTTP + SOCKET.IO SERVER
    |--------------------------------------------------------------------------
    */

    httpServer.listen(env.port, () => {

      console.log(`
==================================================
MEDCARD API + REAL-TIME SERVER
==================================================
Environment : ${env.nodeEnv}
Port        : ${env.port}

API         : http://localhost:${env.port}
Health      : http://localhost:${env.port}/api/v1/health

Socket.IO   : ENABLED
==================================================
`);

    });

  } catch (error) {

    console.error(
      "❌ Failed to start server:",
      error
    );

    await prisma.$disconnect();

    process.exit(1);
  }
};


/*
|--------------------------------------------------------------------------
| GRACEFUL SHUTDOWN
|--------------------------------------------------------------------------
*/

const shutdown = async (signal) => {

  console.log(
    `\n${signal} received. Shutting down...`
  );


  await prisma.$disconnect();


  httpServer.close(() => {

    console.log(
      "MedCard server closed."
    );

    process.exit(0);

  });

};


process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);


/*
|--------------------------------------------------------------------------
| RUN
|--------------------------------------------------------------------------
*/

startServer();