import Link from "next/link";
import Logo from "@/components/Logo";
import prisma from "@/lib/prisma";
import { isRegistrationWindowOpen, formatDateOnlyDubai } from "@/lib/dayjs";
import { MapPin, ArrowRight, Trophy, Medal, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await prisma.challengeSettings.findUnique({ where: { id: "singleton" } });

  const windowStatus = isRegistrationWindowOpen(settings?.registrationStart, settings?.registrationEnd);

  const branches = await prisma.branch.findMany({
    select: { id: true, name: true, label: true, address: true },
    orderBy: { label: "asc" },
  });

  return (
    <main className="min-h-screen flex flex-col bg-background text-white selection:bg-gymRed">
      {/* Top Brand Logo - Centered, Borderless & Seamless */}
      <header className="w-full pt-2 pb-0 sm:pt-8 sm:pb-4 flex items-center justify-center px-4 bg-transparent border-0">
        <Logo size="xl" href="/" />
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 pt-0 pb-16 sm:pt-6 sm:pb-20 flex-1 max-w-4xl mx-auto w-full text-center flex flex-col items-center justify-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-gymRed/15 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Challenge Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-card border border-surface-border text-xs font-semibold text-zinc-300 mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-gymRed animate-pulse" />
          OFFICIAL TRANSFORMATION CHALLENGE
        </div>

        <h1 className="text-2xl min-[380px]:text-[28px] sm:text-5xl md:text-6xl font-black tracking-tight uppercase leading-tight sm:leading-[1.1] mb-5">
          <span className="inline-block">
            TRANSFORM IN <span className="text-gymRed whitespace-nowrap">30 DAYS</span>.
          </span>
          <br />
          <span className="inline-block">
            <span className="text-gymRed whitespace-nowrap">18,000 AED</span> CASH PRIZE
          </span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-xl mb-4 leading-relaxed">
          The ultimate club weight loss competition across our 6 clubs.
          Register online with <span className="text-white font-bold">100% Free Registration</span>, visit any of our club for your Day-1 weigh-in, and start your 30-day countdown!
        </p>

        {/* Free Registration Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Free Registration · No Entry Fee
        </div>

        {/* Prize Pool Highlights */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-lg mb-6">
          <div className="gym-card rounded-2xl p-2 sm:p-4 text-center border-gymRed/40 relative overflow-hidden">
            <div className="flex items-center justify-center text-amber-400 mb-1">
              <Trophy className="w-4 h-4 sm:w-7 sm:h-7" />
            </div>
            <div className="text-base sm:text-2xl font-black text-white">10,000</div>
            <div className="text-[9px] sm:text-xs uppercase font-semibold text-zinc-400 tracking-tight sm:tracking-wider whitespace-nowrap mt-0.5">
              AED · 1st Place
            </div>
          </div>
          <div className="gym-card rounded-2xl p-2 sm:p-4 text-center">
            <div className="flex items-center justify-center text-amber-600 mb-1">
              <Medal className="w-4 h-4 sm:w-7 sm:h-7" />
            </div>
            <div className="text-base sm:text-2xl font-black text-white">5,000</div>
            <div className="text-[9px] sm:text-xs uppercase font-semibold text-zinc-400 tracking-tight sm:tracking-wider whitespace-nowrap mt-0.5">
              AED · 2nd Place
            </div>
          </div>
          <div className="gym-card rounded-2xl p-2 sm:p-4 text-center">
            <div className="flex items-center justify-center text-slate-300 mb-1">
              <Award className="w-4 h-4 sm:w-7 sm:h-7" />
            </div>
            <div className="text-base sm:text-2xl font-black text-zinc-300">3,000</div>
            <div className="text-[9px] sm:text-xs uppercase font-semibold text-zinc-400 tracking-tight sm:tracking-wider whitespace-nowrap mt-0.5">
              AED · 3rd Place
            </div>
          </div>
        </div>

        {/* Action Button */}
        {windowStatus.isOpen ? (
          <div className="w-full max-w-sm flex flex-col items-center gap-3">
            {/* Instagram Requirement Notice */}
            <a href="https://www.instagram.com/faceoff.fitness?stkn=NTB3bG9rZmw3Zmhv" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-pink-500/40 hover:border-pink-500 hover:bg-pink-950/30 text-xs text-zinc-300 hover:text-white transition-all group shadow-sm" title="Follow use on Instragram">
              <svg className="w-6 h-6 text-pink-500 fill-current shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>Make sure to follow <strong className="text-white decoration-pink-500/60 underline-offset-2">@faceoff.fitness</strong> on Instagram to validate your registration</span>
            </a>

            <Link href="/register" className="w-full py-4 px-6 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white font-bold text-base tracking-wide uppercase transition-all shadow-red-glow flex items-center justify-center gap-2 group" >
              <span>Register Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <span className="text-xs text-zinc-400">
              Registration closes on {settings?.registrationEnd ? formatDateOnlyDubai(settings.registrationEnd) : "soon"}
            </span>
          </div>
        ) : (
          <div className="gym-card rounded-xl p-4 max-w-md w-full border-zinc-800 text-zinc-400 text-sm">
            <p className="font-semibold text-white mb-1">Registration Currently Unavailable</p>
            <p>{windowStatus.reason}</p>
          </div>
        )}
      </section>

      {/* How It Works Steps */}
      <section className="border-t border-surface-border bg-surface/40 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-xs font-bold uppercase tracking-widest text-gymRed mb-2">
            SIMPLE 4-STEP PROCESS
          </h2>
          <h3 className="text-center text-2xl font-black uppercase text-white mb-8">
            HOW THE CHALLENGE WORKS
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="gym-card rounded-xl p-4 sm:p-5 flex flex-col items-start text-left">
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gymRed/15 text-gymRed flex items-center justify-center font-black text-base sm:text-lg shrink-0">
                  1
                </div>
                <h4 className="font-bold text-white text-base">Register Online</h4>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Sign up with your Emirates ID and receive your official User ID & QR Code instantly via email. <span className="text-white font-semibold"> Participants must follow{" "}
                  <a href="https://www.instagram.com/faceoff.fitness?stkn=NTB3bG9rZmw3Zmhv" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-blue-400 font-semibold decoration-pink-500/60 underline-offset-2 transition-colors" >
                    @faceoff.fitness
                  </a>{" "}
                  on Instagram to qualify.</span>
              </p>
            </div>

            <div className="gym-card rounded-xl p-4 sm:p-5 flex flex-col items-start text-left">
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gymRed/15 text-gymRed flex items-center justify-center font-black text-base sm:text-lg shrink-0">
                  2
                </div>
                <h4 className="font-bold text-white text-base">Day-1 Weigh-In</h4>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Visit any of our club between 1:00 PM to 10:00 PM with your valid <span className="text-white font-semibold">Emirates ID</span> and present your QR code. Our team will record your official baseline weight to activate your 30-day challenge.
              </p>
            </div>

            <div className="gym-card rounded-xl p-4 sm:p-5 flex flex-col items-start text-left">
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gymRed/15 text-gymRed flex items-center justify-center font-black text-base sm:text-lg shrink-0">
                  3
                </div>
                <h4 className="font-bold text-white text-base">Final Weigh-In</h4>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Return to any of our club on 30th day for your final weigh-in. Our team will record your results.
              </p>
            </div>

            <div className="gym-card rounded-xl p-4 sm:p-5 flex flex-col items-start text-left border-gymRed/30">
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gymRed/15 text-gymRed flex items-center justify-center font-black text-base sm:text-lg shrink-0">
                  4
                </div>
                <h4 className="font-bold text-white text-base">Winner Declaration</h4>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Venue: <span className="text-white font-semibold">Face Off Fitness Al Hamriya Club</span>.
                <br />
                Time: <span className="text-gymRed font-bold">3:00 PM</span>.
                <br />
                Official announcement of the top transformation winners!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Participating Branches */}
      <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <h2 className="text-center text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
          OUR CLUBS
        </h2>
        <p className="text-center text-xs text-zinc-500 mb-6">
          Visit any of our 6 clubs across Dubai for your weigh-ins
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* a) Al Hamriya, Deira dubai - mix gym */}
          <div className="gym-card rounded-xl p-4 text-left flex items-start gap-3 border-zinc-800/80 hover:border-gymRed/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gymRed/15 text-gymRed flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-sm text-white truncate">Al Hamriya</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60 shrink-0">
                  Mix Gym
                </span>
              </div>
              <p className="text-xs text-zinc-400">Deira, Dubai</p>
            </div>
          </div>

          {/* b) Al Hamriya, Deira dubai - ladies gym */}
          <div className="gym-card rounded-xl p-4 text-left flex items-start gap-3 border-zinc-800/80 hover:border-pink-500/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-pink-500/15 text-pink-400 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-sm text-white truncate">Al Hamriya</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-pink-950/50 text-pink-300 border border-pink-800/60 shrink-0">
                  Ladies Gym
                </span>
              </div>
              <p className="text-xs text-zinc-400">Deira, Dubai</p>
            </div>
          </div>

          {/* c) Al Rashidiya, dubai - mix gym */}
          <div className="gym-card rounded-xl p-4 text-left flex items-start gap-3 border-zinc-800/80 hover:border-gymRed/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gymRed/15 text-gymRed flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-sm text-white truncate">Al Rashidiya</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60 shrink-0">
                  Mix Gym
                </span>
              </div>
              <p className="text-xs text-zinc-400">Dubai</p>
            </div>
          </div>

          {/* d) Al Rashidiya, dubai - LADIES gym */}
          <div className="gym-card rounded-xl p-4 text-left flex items-start gap-3 border-zinc-800/80 hover:border-pink-500/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-pink-500/15 text-pink-400 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-sm text-white truncate">Al Rashidiya</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-pink-950/50 text-pink-300 border border-pink-800/60 shrink-0">
                  Ladies Gym
                </span>
              </div>
              <p className="text-xs text-zinc-400">Dubai</p>
            </div>
          </div>

          {/* e) Al Nahda 2 - Dubai - mix gym */}
          <div className="gym-card rounded-xl p-4 text-left flex items-start gap-3 border-zinc-800/80 hover:border-gymRed/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gymRed/15 text-gymRed flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-sm text-white truncate">Al Nahda 2</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60 shrink-0">
                  Mix Gym
                </span>
              </div>
              <p className="text-xs text-zinc-400">Dubai</p>
            </div>
          </div>

          {/* f) Al Barsha, tecom dubai - mix gym */}
          <div className="gym-card rounded-xl p-4 text-left flex items-start gap-3 border-zinc-800/80 hover:border-gymRed/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gymRed/15 text-gymRed flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-sm text-white truncate">Al Barsha</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60 shrink-0">
                  Mix Gym
                </span>
              </div>
              <p className="text-xs text-zinc-400">Tecom, Dubai</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border py-8 text-center text-xs text-zinc-400">
        <div className="flex items-center justify-center gap-3 mb-4">
          {/* Instagram */}
          <a href="https://www.instagram.com/faceoff.fitness" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-pink-500/60 hover:text-pink-400 text-zinc-400 flex items-center justify-center transition-all hover:scale-105" title="Instagram" >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>

          {/* Facebook */}
          <a href="https://www.facebook.com/faceoffgym" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/60 hover:text-blue-400 text-zinc-400 flex items-center justify-center transition-all hover:scale-105" title="Facebook" >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
            </svg>
          </a>

          {/* TikTok */}
          <a href="https://www.tiktok.com/@faceoff.fitness" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-cyan-400/60 hover:text-cyan-300 text-zinc-400 flex items-center justify-center transition-all hover:scale-105" title="TikTok" >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.87-4.47V8.75a8.28 8.28 0 0 0 4.9 1.59V6.9a4.84 4.84 0 0 1-1-.21z" />
            </svg>
          </a>

          {/* Snapchat */}
          <a href="https://www.snapchat.com/@faceoffgym" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-yellow-400/60 hover:text-yellow-300 text-zinc-400 flex items-center justify-center transition-all hover:scale-105" title="Snapchat" >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.002 2c-3.87 0-6.527 2.766-6.527 6.425 0 .867.24 1.765.485 2.502.138.413.25.753.25.962 0 .285-.145.474-.356.657-.27.234-.633.454-1.077.726-.605.37-1.377.842-1.377 1.838 0 .857.575 1.503 1.433 1.614.498.065.98.026 1.408-.01.378-.031.704-.058.948.077.291.162.38.47.472.784.095.33.208.718.528 1.03.35.341.83.504 1.428.504.42 0 .867-.09 1.341-.186.495-.1.996-.202 1.467-.202s.972.102 1.467.202c.474.096.921.186 1.341.186.598 0 1.078-.163 1.428-.504.32-.312.433-.7.528-1.03.092-.314.181-.622.472-.784.244-.135.57-.108.948-.077.428.036.91.075 1.408.01.858-.111 1.433-.757 1.433-1.614 0-.996-.772-1.468-1.377-1.838-.444-.272-.807-.492-1.077-.726-.211-.183-.356-.372-.356-.657 0-.209.112-.549.25-.962.245-.737.485-1.635.485-2.502C18.53 4.766 15.872 2 12.002 2z" />
            </svg>
          </a>

          {/* YouTube */}
          <a href="https://www.youtube.com/@FaceOffGym" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-600/60 hover:text-red-500 text-zinc-400 flex items-center justify-center transition-all hover:scale-105" title="YouTube" >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>
        </div>

        <p className="text-[11px] text-zinc-500">30-Day Weight Loss Challenge · Winners determined strictly by absolute kilograms lost.</p>
        <p className="mt-1">© 2026 Face Off Fitness. All rights reserved. · Dubai, UAE</p>
      </footer>
    </main>
  );
}
