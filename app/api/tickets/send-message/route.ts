import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketId, message } = body

    if (!ticketId || !message) {
      return NextResponse.json(
        { error: 'ID del ticket y mensaje son requeridos' },
        { status: 400 }
      )
    }

    const authToken = request.cookies.get('auth_token')?.value
    if (!authToken) {
      return NextResponse.json(
        { error: 'No autorizado - Token no encontrado' },
        { status: 401 }
      )
    }

    const myHeaders = new Headers()
    myHeaders.append("Accept", "application/json")
    myHeaders.append("Authorization", `Bearer ${authToken}`)

    const formdata = new FormData()
    formdata.append("message", message.trim())

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow"
    }

    const response = await fetch(
      `https://app.conexmeet.live/api/v1/create-commnet/${ticketId}`,
      requestOptions
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.text()
    let parsedResult

    try {
      parsedResult = JSON.parse(result)
    } catch {
      parsedResult = { message: result }
    }

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado correctamente',
      data: parsedResult
    })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}