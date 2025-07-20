import Link from 'next/link';

export default async function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Bienvenido</h1>
        <div className="space-x-4">
          <Link 
            href="/auth/sign-in" 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Iniciar Sesión
          </Link>
          <Link 
            href="/main/video-roulette" 
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Ir a la App
          </Link>
        </div>
      </div>
    </div>
  );
}
