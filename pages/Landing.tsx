import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Play } from "lucide-react";

export const Landing = () => {
    const navigate = useNavigate();

    const handleStart = () => {
        navigate(`/dashboard`);
    };

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-white/20 selection:text-white flex flex-col font-sans overflow-x-hidden">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 h-20 px-6 lg:px-12 flex items-center justify-between z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-xs tracking-tighter">
                        XC
                    </div>
                    <span className="font-bold text-lg tracking-wide hidden sm:block">XcAISTUDIO</span>
                </div>

                <nav className="hidden md:flex items-center gap-10">
                    <a href="#" className="text-[13px] font-medium text-white/90 hover:text-white transition-colors">首页</a>
                    <a href="#" className="text-[13px] font-medium text-white/50 hover:text-white transition-colors">定价</a>
                    <a href="#" className="text-[13px] font-medium text-white/50 hover:text-white transition-colors">新闻</a>
                </nav>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleStart}
                        className="px-5 py-2.5 bg-white text-black rounded-full text-[13px] font-bold hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02] transition-all active:scale-95"
                    >
                        开始体验
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-4 relative z-10 w-full max-w-[1400px] mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center text-center max-w-4xl"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8">
                        <Sparkles size={12} className="text-blue-400" />
                        <span className="text-[11px] font-medium tracking-widest uppercase text-white/80">你的 AI 设计助手</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-light tracking-tight leading-[1.1] mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                        为新生代运动品牌<sup className="text-2xl md:text-4xl ml-2 text-white/40 top-[-0.6em] relative">(1)</sup><br />
                        <span className="italic font-light">设计一个商品详情页</span>
                    </h1>

                    <button
                        onClick={handleStart}
                        className="mt-12 group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-full text-[15px] font-bold overflow-hidden transition-transform hover:scale-105 active:scale-95"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative">立即设计</span>
                        <ArrowRight size={18} className="relative group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>

                {/* Mockup Showcase Interface */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-24 w-full relative"
                >
                    {/* Background blob for style */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#E8E1DA] rounded-[100px] blur-[100px] opacity-20 -z-10" />

                    <div className="w-full h-[600px] max-w-6xl mx-auto bg-[#1C1C1E]/80 backdrop-blur-xl rounded-[24px] border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">

                        {/* Fake App Header */}
                        <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#252528]/50">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-green-400" />
                                </div>
                                <span className="text-sm font-medium text-white/80">运动产品发布</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-white/20" />
                                <div className="w-2 h-2 rounded-full bg-white/20" />
                                <div className="w-2 h-2 rounded-full bg-white/20" />
                            </div>
                        </div>

                        {/* Fake App Body */}
                        <div className="flex-1 flex p-6 gap-6 relative">
                            {/* Main Canvas Area */}
                            <div className="flex-1 bg-[#2C2C2E]/30 rounded-2xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                                <div className="absolute top-4 left-4 text-xs font-mono text-white/30 tracking-widest">Video</div>
                                <div className="absolute top-4 right-4 text-xs font-mono text-white/30">800 × 1440</div>

                                <div className="relative w-[340px] h-[480px] bg-gray-900 rounded-lg shadow-2xl flex items-center justify-center overflow-hidden ring-1 ring-blue-500/50">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-60 grayscale hover:grayscale-0 transition-all duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                                        <h3 className="text-xl font-bold font-serif text-white mb-2">RUN. FASTER.</h3>
                                        <div className="w-12 h-1 bg-blue-500 mb-4" />
                                        <div className="flex items-center gap-2 text-xs text-white/60">
                                            <Play size={12} fill="currentColor" /> 00:04 / 00:15
                                        </div>
                                    </div>

                                    {/* Play Button Mock */}
                                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                        <Play size={24} className="text-white ml-1" fill="currentColor" />
                                    </div>
                                </div>
                            </div>

                            {/* Fake Chat Sidebar */}
                            <div className="w-[320px] bg-[#252528] rounded-2xl border border-white/5 p-5 flex flex-col gap-4">
                                <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">新对话</div>

                                <div className="bg-white/5 p-4 rounded-xl text-sm text-white/80 leading-relaxed border border-white/5">
                                    为新款跑鞋生成详情页的主视觉，包括主题、产品特写和展示性能与材质的运动员上脚照。
                                </div>

                                <div className="flex flex-col gap-2.5 mt-2">
                                    <div className="flex items-center gap-2 text-xs text-white/50">
                                        <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center"><div className="w-1 h-1 bg-white/50 rounded-full" /></div>
                                        已分析用户意图
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-white/50">
                                        <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center"><div className="w-1 h-1 bg-white/50 rounded-full" /></div>
                                        已生成视觉概念
                                    </div>
                                </div>

                                <div className="bg-blue-500/10 p-4 rounded-xl text-sm text-blue-100/90 leading-relaxed mt-auto border border-blue-500/20">
                                    我已为新一代跑鞋产品详情页生成了一套视觉素材，聚焦清晰度和性能感染力。
                                </div>
                            </div>
                        </div>

                    </div>
                </motion.div>
            </main>

            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px]" />
            </div>
        </div>
    );
};

export default Landing;
