import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(accounts)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const account = await prisma.account.create({
      data: {
        username: body.username,
        email: body.email || null,
        password: body.password,
        twoFaCode: body.twoFaCode || null,
        proxyIp: body.proxyIp || null,
        proxyPort: body.proxyPort || null,
        proxyUser: body.proxyUser || null,
        proxyPass: body.proxyPass || null,
      },
    })
    return NextResponse.json(account)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
