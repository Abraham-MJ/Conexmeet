import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: "Faltan datos" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch("https://app.conexmeet.live/api/v1/login", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || "Error en el login" },
        { status: response.status }
      );
    }

    const token = data.token;

    const res = NextResponse.json({ success: true, message: "Login exitoso" });
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error en el servidor" },
      { status: 500 }
    );
  }
}
