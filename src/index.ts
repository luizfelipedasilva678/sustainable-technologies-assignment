import { exec } from "node:child_process";
import { promisify } from "node:util";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import initDB from "./db";
import { createMiddleware } from "hono/factory";
import { serveStatic } from "@hono/node-server/serve-static";

try {
  const connection = initDB();
  const app = new Hono();

  console.log();

  app.get("/", serveStatic({ path: "./src/views/index.html" }));
  app.get("/login", serveStatic({ path: "./src/views/login.html" }));
  app.get("/register", serveStatic({ path: "./src/views/register.html" }));

  app.use(
    createMiddleware(async (c, next) => {
      const token = getCookie(c, "clientToken");
      c.set("logged", !!token);
      await next();
    })
  );

  const port = 3000;

  serve({
    fetch: app.fetch,
    port,
  });
} catch (e) {
  console.error(e);
}
