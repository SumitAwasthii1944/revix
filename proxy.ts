import { auth } from "@/auth.config"
import { NextResponse } from "next/server"

// Routes that should stay public
const PUBLIC_ROUTES = ["/user/signin", "/api/auth","/api/webhooks"]

export default auth((req: any) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  if (nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    nextUrl.pathname.startsWith(route)
  )

  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/user/signin", nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)// searchParams.set("callbackUrl", nextUrl.pathname) is used to redirect the user back to the page they were trying to access after they log in. 
    //It appends the current pathname to the login URL as a query parameter named "callbackUrl". This way, after a successful login, the application can read this parameter and redirect the user back to their original destination.
    return NextResponse.redirect(loginUrl)
  }

  // already logged in, trying to view the login page -> send home
  if (isLoggedIn && nextUrl.pathname === "/user/signin") {
    return NextResponse.redirect(new URL("/", nextUrl.origin))
  }
})

export const config = {
  // run on everything except static assets and Next internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}