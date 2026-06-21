import React, { useState } from 'react';
import bgImage from "../assets/images/pub_background_1781992732386.jpg";
import logo from "../assets/images/agai_logo_1781992158822.jpg";
import { motion } from "motion/react";

type LoginPageProps = {
  onLogin: () => void;
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="flex min-h-screen w-full items-center justify-center relative overflow-hidden p-6 sm:p-12 md:p-16">
      <div className="absolute inset-0 z-[-1] bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }}>
         <div className="absolute inset-0 bg-[#0B0D11]/85 backdrop-blur-[2px]"></div>
      </div>
      
      <div className="bg-sky-950/40 backdrop-blur-md border border-sky-500/20 p-8 sm:p-10 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(56,189,248,0.15)] flex flex-col items-center my-auto relative z-10 transition-all duration-300">
         <motion.img 
            src={logo} 
            alt="AGAI True Pub Logo" 
            className="w-32 h-auto mb-8 rounded-2xl shadow-xl border border-sky-500/20 cursor-pointer" 
            animate={{
              y: [0, -10, 0]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
         />
         <h1 className="text-2xl font-bold text-gray-100 mb-6 font-sans">Welcome Back</h1>
         
         <div className="w-full space-y-4">
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0B0D11]/60 backdrop-blur-sm border border-sky-950 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 text-gray-200 transition-all"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0B0D11]/60 backdrop-blur-sm border border-sky-950 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 text-gray-200 transition-all"
            />
            <button 
              onClick={onLogin}
              className="w-full bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-sky-500/10 transition-all cursor-pointer"
            >
              Sign In
            </button>
         </div>
      </div>
    </div>
  );
}
