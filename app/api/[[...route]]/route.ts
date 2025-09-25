import {z} from 'zod'
import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'

export const runtine = "edge"

const app = new Hono().basePath("/api")

app.get('/',
    clerkMiddleware(),
    (c) => {
        const auth = getAuth(c)
        if (!auth?.userId) {
            
        }
  return c.json({
    message: "Hello World"
  })
})

export const GET = handle(app)
export const POST = handle(app)