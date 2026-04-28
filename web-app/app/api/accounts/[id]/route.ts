import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.account.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const account = await prisma.account.update({
      where: { id: params.id },
      data: body,
    })
    return NextResponse.json(account)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
  }
}
