'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Users, Video } from 'lucide-react';
import { BiMessageDetail } from 'react-icons/bi';
import { BsGift } from 'react-icons/bs';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-pink-50 via-white to-red-50">
      <div className="absolute inset-0">
        <div className="absolute left-10 top-20 h-20 w-20 rounded-full bg-gradient-to-r from-[#f711ba]/20 to-[#ff465d]/20 blur-xl"></div>
        <div className="absolute right-20 top-40 h-32 w-32 rounded-full bg-gradient-to-r from-[#ff465d]/20 to-[#f711ba]/20 blur-xl"></div>
        <div className="absolute bottom-40 left-20 h-24 w-24 rounded-full bg-gradient-to-r from-[#f711ba]/20 to-[#ff465d]/20 blur-xl"></div>
      </div>

      <div className="relative mx-auto max-w-[1580px] px-6 pb-16 pt-24 md:pt-28 lg:px-8 lg:pt-20">
        <div className="grid min-h-[80vh] items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Content Section */}
          <div className="order-2 space-y-6 lg:order-1 lg:space-y-8">
            <div className="space-y-4 lg:space-y-6">
              <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
                Una plataforma global{' '}
                <span className="bg-gradient-to-r from-[#f711ba] to-[#ff465d] bg-clip-text text-transparent">
                  de video chat
                </span>
              </h1>

              <p className="text-lg leading-relaxed text-gray-600 sm:text-xl lg:text-2xl">
                Para la interacción y comunicación entre personas de todo el
                mundo
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <div className="flex items-center space-x-2 rounded-xl border border-pink-100/50 bg-white/60 bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] p-2.5 backdrop-blur-sm sm:space-x-3 sm:p-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10">
                  <Video className="h-6 w-6 text-white sm:h-8 sm:w-8" />
                </div>
                <span className="text-xs font-medium text-white sm:text-sm md:text-base">
                  Video Chat
                </span>
              </div>

              <div className="flex items-center space-x-2 rounded-xl border border-pink-100/50 bg-white/60 bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] p-2.5 backdrop-blur-sm sm:space-x-3 sm:p-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10">
                  <BiMessageDetail className="h-6 w-6 text-white sm:h-8 sm:w-8" />
                </div>
                <span className="text-xs font-medium text-white sm:text-sm md:text-base">
                  Messaging
                </span>
              </div>

              <div className="flex items-center space-x-2 rounded-xl border border-pink-100/50 bg-white/60 bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] p-2.5 backdrop-blur-sm sm:space-x-3 sm:p-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10">
                  <BsGift className="h-6 w-6 text-white sm:h-8 sm:w-8" />
                </div>
                <span className="text-xs font-medium text-white sm:text-sm md:text-base">
                  Gifts
                </span>
              </div>

              <div className="flex items-center space-x-2 rounded-xl border border-pink-100/50 bg-white/60 bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] p-2.5 backdrop-blur-sm sm:space-x-3 sm:p-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10">
                  <Users className="h-6 w-6 text-white sm:h-8 sm:w-8" />
                </div>
                <span className="text-xs font-medium text-white sm:text-sm md:text-base">
                  Peer to Peer
                </span>
              </div>
            </div>

            <div className="flex">
              <Link
                href="/auth/sign-in"
                className="group inline-flex transform items-center justify-center rounded-full bg-gradient-to-r from-[#f711ba] to-[#ff465d] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-500/25 sm:px-8 sm:py-4 sm:text-base"
              >
                Empezar Video Chat
              </Link>
            </div>
          </div>

          {/* Image Section */}
          <div className="relative order-1 mb-8 flex justify-center lg:order-2 lg:mb-0 lg:justify-end">
            <div className="from-[#f711ba]/8 to-[#ff465d]/8 absolute inset-0 scale-125 rounded-full bg-gradient-to-r blur-3xl"></div>

            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-md xl:max-w-lg">
              <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-2xl bg-gradient-to-br from-[#f711ba]/25 to-[#ff465d]/25 blur-lg sm:translate-x-3 sm:translate-y-3"></div>
              <svg width="0" height="0" aria-hidden="true" className="absolute">
                <defs>
                  <filter
                    id="edge-grain"
                    x="-0.6"
                    y="-0.6"
                    width="1.8"
                    height="1.6"
                    colorInterpolationFilters="sRGB"
                  >
                    <feGaussianBlur
                      in="SourceAlpha"
                      stdDeviation="10"
                      result="blur"
                    />

                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="2"
                      numOctaves="2"
                      result="noise"
                    />

                    <feDisplacementMap
                      in="blur"
                      in2="noise"
                      scale="8"
                      xChannelSelector="R"
                      yChannelSelector="G"
                      result="displaced"
                    />

                    <feComposite
                      in="SourceGraphic"
                      in2="displaced"
                      operator="in"
                    />
                  </filter>
                </defs>
              </svg>

              <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl">
                <Image
                  src="/images/banner-female.png"
                  alt="Conexmeet - Video Chat Platform"
                  width={450}
                  height={450}
                  className="relative"
                  style={{ 
                    filter: 'url(#edge-grain)',
                    width: '100%',
                    height: 'auto'
                  }}
                />

                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl lg:rounded-3xl"
                  style={{
                    background: `
                      radial-gradient(ellipse at center, 
                        transparent 70%, 
                        rgba(248, 250, 252, 0.2) 85%, 
                        rgba(248, 250, 252, 0.6) 95%,
                        rgba(248, 250, 252, 0.9) 100%
                      )
                    `,
                  }}
                ></div>
              </div>
            </div>

            {/* Floating elements - only visible on desktop */}
            <div className="absolute -left-4 top-8 hidden h-16 w-16 animate-pulse rounded-full bg-gradient-to-r from-[#f711ba]/15 to-[#ff465d]/15 blur-xl lg:block"></div>
            <div className="absolute -right-6 bottom-16 hidden h-20 w-20 animate-pulse rounded-full bg-gradient-to-r from-[#ff465d]/15 to-[#f711ba]/15 blur-xl delay-1000 lg:block"></div>
            <div className="absolute -right-2 top-1/3 hidden h-12 w-12 animate-bounce rounded-full bg-gradient-to-r from-[#f711ba]/20 to-[#ff465d]/20 blur-lg delay-500 sm:block"></div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" className="h-20 w-full fill-white">
          <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
