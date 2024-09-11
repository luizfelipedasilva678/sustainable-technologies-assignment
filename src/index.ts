import initDB from "./db";
import getHash from "./services/getHash";
import getFileContent from "./services/getFileContent";
import path from "node:path";
import cowsay from "cowsay";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { sign, verify } from "jsonwebtoken";

const SECRET = "SECRET";

type Variables = {
  logged: boolean;
  username: string;
};

async function start() {
  try {
    const connection = await initDB();
    const app = new Hono<{ Variables: Variables }>();

    app.use(
      createMiddleware(async (c, next) => {
        try {
          const cookie = getCookie(c, "clientAuthToken");

          const { username } = verify(cookie ?? "", SECRET) as any;

          c.set("logged", true);
          c.set("username", username);
        } catch (e) {
          c.set("logged", false);
          c.set("username", "");
        }

        await next();
      })
    );

    app.get("/", async (c) => {
      const isLogged = c.get("logged");
      const html = await getFileContent(
        path.join(__dirname, "views", "index.html")
      );

      if (!isLogged) {
        return c.redirect("/login");
      }

      return c.html(html);
    });
    app.get("/session", (c) => {
      return c.json(
        { logged: c.get("logged"), username: c.get("username") },
        200
      );
    });
    app.get("/logout", (c) => {
      deleteCookie(c, "clientAuthToken");
      return c.redirect("/login");
    });
    app
      .get("/login", async (c) => {
        const isLogged = c.get("logged");
        const html = await getFileContent(
          path.join(__dirname, "views", "login.html")
        );

        if (isLogged) {
          return c.redirect("/");
        }

        return c.html(html);
      })
      .post(async (c) => {
        try {
          const { username, password } = await c.req.json();

          if (!username || !password) {
            return c.json(
              { message: "Username and password are required" },
              400
            );
          }

          const [r] = await connection.query(
            "SELECT * FROM User WHERE username = ? AND password = ?",
            [username, getHash(password)]
          );

          const result = r as any[];

          if (result.length > 0) {
            const clientAuthToken = sign(
              {
                username: result[0].username,
              },
              SECRET
            );

            setCookie(c, "clientAuthToken", clientAuthToken, {
              path: "/",
              httpOnly: true,
              maxAge: 60 * 60 * 24 * 30,
              sameSite: "strict",
              secure: false,
            });

            return c.json({ username: result[0].username }, 200);
          }

          return c.json({ message: "Invalid username or password" }, 401);
        } catch (e) {
          return c.json({ message: "Something went wrong" }, 500);
        }
      });
    app
      .get("/register", async (c) => {
        const isLogged = c.get("logged" as never);
        const html = await getFileContent(
          path.join(__dirname, "views", "register.html")
        );

        if (isLogged) {
          return c.redirect("/");
        }

        return c.html(html);
      })
      .post(async (c) => {
        try {
          const { username, password } = await c.req.json();

          if (!username || !password) {
            return c.json(
              { message: "Username and password are required" },
              400
            );
          }

          await connection.query(
            "INSERT INTO User (username, password) VALUES (?, ?)",
            [username, getHash(password)]
          );

          return c.json({ username, password }, 200);
        } catch (e: any) {
          if (e.code === "ER_DUP_ENTRY") {
            return c.json({ message: "Username already exists" }, 400);
          }

          return c.json({ message: "Something went wrong" }, 500);
        }
      });
    app.get("/cowsay", (c) => {
      return c.json(
        {
          message: cowsay.say({
            text: `Hello ${c.get("username")}!`,
            e: "oO",
            T: "U ",
          }),
        },
        200
      );
    });

    app.get("*", (c) => {
      return c.text("Not found", 404);
    });

    const port = 3000;

    serve({
      fetch: app.fetch,
      port,
    });
  } catch (e) {
    console.error(e);
  }
}

start();
