
import { RPCHandler } from '@orpc/server/fetch'
import { onError } from '@orpc/server'
import { router } from '@/app/router'

// Create an RPC handler with your app’s router and error interceptor
const handler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error('[RPC Error]:', error)
    }),
  ],
})

// Generic request handler for all HTTP methods
async function handleRequest(request: Request) {
  const { response } = await handler.handle(request, {
    prefix: '/rpc', // your RPC route prefix
    context: {},    // optional context for shared data (auth, db, etc.)
  })

  return response ?? new Response('Not found', { status: 404 })
}

// Export all HTTP methods for Next.js App Router
export const HEAD = handleRequest
export const GET = handleRequest
export const POST = handleRequest
export const PUT = handleRequest
export const PATCH = handleRequest
export const DELETE = handleRequest
