import { db } from "./db";
import { myTable } from "./schema";
import { Hono } from "hono";
import { auth } from "./auth";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import api from "./main-api";
const app = new Hono();

app.use(
    '/api/auth/*',
    // cors({
    //     origin: "http://localhost:5173",
    //     credentials: true,
    // })
    cors({
        origin: "http://localhost:5173",
        allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,  
    })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));


app.route('/api/', api)

serve(app)