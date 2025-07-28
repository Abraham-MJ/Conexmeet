import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get('id')


    if (!ticketId) {
      return NextResponse.json(
        { error: 'ID del ticket es requerido' },
        { status: 400 }
      )
    }

    const authToken = request.cookies.get('auth_token')?.value
    if (!authToken) {
      console.error('Token de autorización no encontrado en cookies')
      return NextResponse.json(
        { error: 'No autorizado - Token no encontrado' },
        { status: 401 }
      )
    }

    const myHeaders = new Headers()
    myHeaders.append("Accept", "application/json")
    myHeaders.append("Authorization", `Bearer ${authToken}`)

    const requestOptions: RequestInit = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    }

    const apiUrl = `https://app.conexmeet.live/api/v1/ticket/${ticketId}`

    const response = await fetch(apiUrl, requestOptions)


    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error de la API externa:', errorText)
      
      let errorMessage = `Error ${response.status}: ${response.statusText}`
      
      if (response.status === 401) {
        errorMessage = 'Token de autorización inválido o expirado'
      } else if (response.status === 404) {
        errorMessage = `Ticket con ID ${ticketId} no encontrado`
      } else if (response.status === 403) {
        errorMessage = 'No tienes permisos para acceder a este ticket'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorText,
          status: response.status
        },
        { status: response.status >= 500 ? 500 : 400 }
      )
    }

    const responseText = await response.text()

    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Error parseando JSON:', parseError)
      return NextResponse.json(
        { error: 'Respuesta inválida de la API externa' },
        { status: 500 }
      )
    }

    if (result.status && result.status !== "Success") {
      console.error('API retornó error:', result)
      return NextResponse.json(
        { error: result.message || 'Error al obtener el ticket' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data || result
    })

  } catch (error) {
    console.error('Error completo fetching ticket details:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}