import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RetroCard, RetroButton } from '../components/RetroUI';
import { Clock, Zap, Shield, BarChart2, MousePointer, Activity, Eye, Linkedin, Github, Twitter } from 'lucide-react';

const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

export default function Landing({ session }) {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ count: 0, gmailCount: 0, newToday: 0, visitCount: 0 });
    const [openFaq, setOpenFaq] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Add timestamp to prevent caching
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stats/user-count?t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to fetch stats:", err);
            }
        };

        const recordVisit = async () => {
            try {
                await fetch(`${import.meta.env.VITE_API_URL}/api/stats/visit`, { method: 'POST' });
            } catch (err) {
                console.error("Failed to record visit:", err);
            }
        };

        fetchStats();
        recordVisit();
    }, []);

    const userCount = stats.count;

    const faqItems = [
        {
            q: "IS MY DATA SAFE?",
            a: "YES. WE DON'T SELL YOUR DATA. ALL TRACKING HAPPENS IN YOUR BROWSER. WE ONLY SYNC ANALYTICS TO YOUR CLOUD IF YOU CHOOSE TO."
        },
        {
            q: "DOES IT SLOW DOWN MY BROWSER?",
            a: "NO. NONO RUNS ON LOW-LEVEL BROWSER APIS. IT CONSUMES LESS RAM THAN A SINGLE STATIC TAB."
        },
        {
            q: "IS IT REALLY FREE?",
            a: "YES. THE CORE TRACKER IS FREE FOREVER. WE MIGHT ADD PREMIUM FEATURES LATER, BUT THE BASIC STUFF STAYS OPEN SOURCE."
        },
        {
            q: "HOW DO I INSTALL THE EXTENSION?",
            a: "GO TO RELEASES, DOWNLOAD THE ZIP, AND LOAD IT INTO CHROME VIA 'DEVELOPER MODE'. 1-CLICK INSTALL COMING SOON TO CHROME WEB STORE."
        }
    ];

    return (
        <div className="min-h-screen bg-retro-bg font-mono overflow-x-hidden relative">
            {/* CRT Scanline Effect Overlay */}
            <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>

            {/* Navbar */}
            <nav className="w-full max-w-6xl mx-auto p-6 flex justify-between items-center z-50 relative">
                <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex items-center gap-3 transform -rotate-2"
                >
                    <img src="/nono.png" alt="Logo" className="w-10 h-10 border-2 border-black shadow-retro" />
                    <span className="text-2xl font-black bg-white inline-block px-2 border-2 border-black shadow-retro">
                        NONO
                    </span>
                </motion.div>
                <div className="flex gap-4">
                    {session ? (
                        <RetroButton onClick={() => navigate('/dashboard')}>Go to Dashboard</RetroButton>
                    ) : (
                        <>
                            <RetroButton variant="white" onClick={() => navigate('/login')}>Login</RetroButton>
                            <RetroButton onClick={() => navigate('/login')}>Start Free</RetroButton>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative w-full max-w-5xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
                <motion.div
                    animate={{ y: [0, -20, 0], rotate: [5, 10, 5] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="absolute top-10 left-10 md:left-0 hidden md:block text-retro-accent shadow-retro bg-white p-2 border-2 border-black"
                >
                    <Clock size={48} strokeWidth={2.5} />
                </motion.div>
                <motion.div
                    animate={{ y: [0, 20, 0], rotate: [-10, -5, -10] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                    className="absolute top-20 right-10 md:right-0 hidden md:block text-retro-primary shadow-retro bg-white p-2 border-2 border-black"
                >
                    <Zap size={48} strokeWidth={2.5} />
                </motion.div>

                <motion.h1
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="text-5xl md:text-8xl font-black mb-6 bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-6 inline-block transform -rotate-1 uppercase leading-none"
                >
                    SAY "NO NO"<br />TO DISTRACTION.
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="mb-8 flex flex-col items-center gap-3"
                >
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <img
                                key={i}
                                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${i + 42}`}
                                alt="User"
                                className="w-12 h-12 rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000]"
                            />
                        ))}
                        <div className="w-12 h-12 rounded-none border-2 border-black bg-retro-secondary flex items-center justify-center text-white font-black text-sm shadow-[4px_4px_0px_0px_#000]">
                            +{userCount}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-retro-secondary text-white px-6 py-3 border-2 border-black shadow-[6px_6px_0px_0px_#000] transform rotate-1">
                        <Zap size={20} className="animate-pulse" />
                        <span className="font-black text-md uppercase tracking-wider">
                            {userCount + 100}+ PRODUCTIVITY WARRIORS ARMED
                        </span>
                    </div>
                </motion.div>

                <motion.p
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    className="text-lg md:text-2xl font-bold text-gray-700 max-w-3xl mb-12 bg-white border-2 border-black p-6 shadow-retro transform rotate-1"
                >
                    The web is weaponized to steal your attention. Nono is your shield. A privacy-first, retro-brutalist time tracker that lives in your browser and tells you the harsh truth about your focus.
                </motion.p>

                <motion.div
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center gap-6"
                >
                    <RetroButton
                        onClick={() => window.open('https://github.com/OneforAll-Deku/NONO/releases/tag/v1.0.0', '_blank')}
                        className="text-2xl px-12 py-5 !bg-retro-accent text-white shadow-[8px_8px_0px_0px_#000] hover:scale-105"
                    >
                        [ DOWNLOAD EXTENSION ]
                    </RetroButton>
                    <button
                        onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                        className="text-retro-secondary font-black text-xl hover:underline transition-colors animate-bounce mt-4"
                    >
                        ↓ HOW IT WORKS ↓
                    </button>
                </motion.div>
            </header>

            {/* Problem Section */}
            <section id="problem-block" className="w-full bg-black py-32 px-6 border-y-8 border-white text-center overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none flex flex-wrap gap-4 overflow-hidden">
                    {Array.from({ length: 100 }).map((_, i) => (
                        <span key={i} className="text-white text-xs font-bold">ERROR 404 DISTRACTION</span>
                    ))}
                </div>
                <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10">
                    <motion.div
                        initial={{ scale: 0, rotate: 180 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        className="text-white mb-8"
                    >
                        <Eye size={80} strokeWidth={3} className="text-retro-secondary" />
                    </motion.div>

                    <h2 className="text-5xl md:text-8xl font-black text-white mb-10 uppercase tracking-tighter leading-none">
                        STAYING FOCUS IS <br /><span className="text-retro-accent bg-white px-4">WAR.</span>
                    </h2>

                    <p className="text-xl md:text-3xl font-bold text-white leading-tight max-w-3xl border-4 border-white p-8 shadow-[12px_12px_0px_0px_#F266AB] transform rotate-1">
                        Infinite scrolls, targeted ads, and algorithmic feedback loops. You aren't lazy, you are being manipulated.
                        <br /><br />
                        <span className="text-black bg-white px-2 italic">Nono is the counter-measure.</span>
                    </p>
                </div>
            </section>

            {/* Stats Marquee */}
            <div className="w-full bg-retro-primary border-b-4 border-black py-6 overflow-hidden select-none">
                <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: "-50%" }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="flex whitespace-nowrap gap-12 items-center"
                >
                    {[1, 2].map((i) => (
                        <div key={i} className="flex gap-12 items-center">
                            <span className="text-3xl font-black uppercase text-black italic">⚡ BATTLE-READY ⚡</span>
                            <span className="text-3xl font-black uppercase text-white shadow-retro px-2 bg-black">🚀 {userCount + 50} TOTAL JOINED</span>
                            <span className="text-3xl font-black uppercase text-black italic">⚡ NO BULLSHIT ⚡</span>
                            <span className="text-3xl font-black uppercase text-white shadow-retro px-2 bg-black">👀 {stats.visitCount + 1000} VISITS</span>
                            <span className="text-3xl font-black uppercase text-black italic">⚡ PRIVACY FIRST ⚡</span>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-32 px-6 bg-white border-b-4 border-black">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl md:text-7xl font-black mb-20 text-center uppercase tracking-tighter">
                        THE <span className="text-retro-accent underline">TACTICAL</span> PLAN
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Dashed) */}
                        <div className="absolute top-1/2 left-0 w-full h-1 border-t-4 border-dashed border-black hidden md:block z-0 opacity-20"></div>

                        {[
                            { step: "01", title: "DEPLOY", desc: "Install the Nono extension. It begins monitoring your active tabs instantly.", icon: <Zap /> },
                            { step: "02", title: "TRACK", desc: "Nono categorizes your visits. It knows when you focus and when you drift.", icon: <Shield /> },
                            { step: "03", title: "RECLAIM", desc: "View your brutalist dashboard. Identify the leaks and seal them.", icon: <Activity /> }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ y: 50, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                transition={{ delay: idx * 0.2 }}
                                className="relative z-10"
                            >
                                <RetroCard className="h-full border-4 hover:-translate-y-2 transition-transform bg-white">
                                    <div className="text-4xl font-black text-gray-200 mb-4">{item.step}</div>
                                    <div className="bg-black text-white w-14 h-14 flex items-center justify-center border-2 border-black shadow-retro mb-6 transform -rotate-3">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-2xl font-black mb-4 uppercase">{item.title}</h3>
                                    <p className="text-md font-bold text-gray-700 leading-snug">
                                        {item.desc}
                                    </p>
                                </RetroCard>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Showcase Section */}
            <section className="w-full bg-black py-32 text-white border-y-8 border-retro-primary overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-retro-primary blur-[120px] opacity-20 pointer-events-none"></div>
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16 relative z-10">
                    <div className="flex-1">
                        <motion.h2
                            initial={{ x: -100, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-5xl md:text-6xl font-black mb-8 text-retro-primary uppercase tracking-tighter leading-none"
                        >
                            THE FOCUS COMMAND <br /> CENTER
                        </motion.h2>
                        <p className="text-xl font-bold mb-8 text-gray-300 leading-relaxed border-l-4 border-retro-primary pl-6">
                            Smart Time Tracker provides the high-fidelity data you need to execute your day with precision. Spot distractions, monitor focus trends, and optimize your deployment.
                        </p>
                        <div className="space-y-6">
                            {[
                                { t: "REAL-TIME INTEL", d: "Live activity feed of every second spent.", c: "text-green-400" },
                                { t: "DAILY FOCUS SCORE", d: "A brutal assessment of your performance.", c: "text-retro-secondary" },
                                { t: "EXPORTABLE LOGS", d: "Take your data anywhere. You own it.", c: "text-retro-accent" }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-start gap-4"
                                >
                                    <div className={`mt-1 h-3 w-3 ${item.c} bg-current`}></div>
                                    <div>
                                        <h4 className={`font-black uppercase ${item.c}`}>{item.t}</h4>
                                        <p className="text-sm font-bold opacity-70">{item.d}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    <motion.div
                        initial={{ scale: 0.8, rotate: 5, opacity: 0 }}
                        whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        className="flex-1 w-full"
                    >
                        <div className="bg-white p-2 border-[6px] border-retro-primary shadow-[15px_15px_0px_0px_rgba(255,184,76,0.3)] relative group">
                            <div className="absolute -top-4 -left-4 bg-retro-secondary text-white px-3 py-1 font-black text-xs border-2 border-black z-20">
                                LIVE_FEED.EXE
                            </div>
                            <img
                                src="/dashboard-preview.png"
                                alt="Dashboard Preview"
                                className="w-full h-auto border-2 border-black grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>
            <section className="py-24 px-6 bg-retro-bg">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-6xl font-black mb-12 text-center uppercase transform -rotate-1">
                        ROADMAP <span className="bg-black text-white px-2">v.1.x</span>
                    </h2>
                    <div className="space-y-6">
                        {[
                            { status: "DONE", label: "Core Time Tracking Engine", color: "bg-green-400" },
                            { status: "DONE", label: "Google Sign-in Integration", color: "bg-green-400" },
                            { status: "NEXT", label: "Chrome Web Store Launch", color: "bg-retro-primary" },
                            { status: "WIP", label: "Gamified Focus Challenges", color: "bg-retro-secondary" },
                            { status: "IDEA", label: "AI Distraction Predictor", color: "bg-retro-accent" }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: -20, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                className="flex items-center gap-4 border-2 border-black p-4 bg-white shadow-retro"
                            >
                                <div className={`${item.color} px-3 py-1 border-2 border-black font-black text-xs min-w-[70px] text-center shadow-[2px_2px_0px_1px_#000]`}>
                                    {item.status}
                                </div>
                                <span className="font-bold text-lg uppercase">{item.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 px-6 bg-white border-y-4 border-black">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-5xl font-black mb-16 text-center uppercase italic underline shadow-text">INTEL / FAQ</h2>
                    <div className="space-y-4">
                        {faqItems.map((item, i) => (
                            <div key={i} className="border-2 border-black">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex justify-between items-center p-6 bg-white hover:bg-gray-50 text-left transition-colors"
                                >
                                    <span className="font-black text-xl uppercase tracking-tighter">{item.q}</span>
                                    <span className="text-3xl font-black">{openFaq === i ? '−' : '+'}</span>
                                </button>
                                {openFaq === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        className="p-6 pt-0 bg-retro-bg font-bold text-gray-700 border-t-2 border-black"
                                    >
                                        {item.a}
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer Area */}
            <footer className="w-full py-20 px-6 text-center bg-retro-bg relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 pointer-events-none select-none text-[20rem] font-black leading-none flex items-center justify-center">
                    NONO
                </div>
                <div className="relative z-10 max-w-4xl mx-auto">
                    <h2 className="text-4xl md:text-6xl font-black mb-10 uppercase leading-tight">
                        STOP LOSING TO THE<br />
                        <span className="text-white bg-black px-4 shadow-[8px_8px_0px_0px_#F266AB]">ALGORITHM.</span>
                    </h2>

                    <RetroButton
                        onClick={() => window.open('https://github.com/OneforAll-Deku/NONO', '_blank')}
                        className="text-2xl px-12 py-5 bg-retro-secondary text-white shadow-[8px_8px_0px_0px_#000] mb-12"
                    >
                        [ ENLIST NOW ]
                    </RetroButton>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left border-t-4 border-black pt-12">
                        <div>
                            <h4 className="font-black text-xl mb-4 uppercase underline">The Mission</h4>
                            <p className="font-bold text-gray-600 leading-snug">
                                We are building tools for the modern internet escape artist. Open source, privacy-first, and intentionally bold. No trackers, no bloat.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-black text-xl mb-4 uppercase underline">Follow the Signal</h4>
                            <div className="flex gap-6 mt-4">
                                <a href="https://github.com/Rajneesh1109/Nano.git" className="hover:text-retro-accent transition-colors flex items-center gap-2 font-black">
                                    <Github /> GITHUB
                                </a>
                                <a href="https://x.com/RajneeshC2507" className="hover:text-retro-secondary transition-colors flex items-center gap-2 font-black">
                                    <Twitter /> @RajneeshC2507
                                </a>
                            </div>
                            <p className="mt-8 text-xs font-black uppercase text-gray-400">
                                handmade by <span className="bg-black text-white px-1">RAJNEESH</span> in 2026.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
