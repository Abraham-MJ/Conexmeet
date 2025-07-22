import Header from './components/landing/Header';
import HeroSection from './components/landing/HeroSection';

export default async function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
    </div>
  );
}
