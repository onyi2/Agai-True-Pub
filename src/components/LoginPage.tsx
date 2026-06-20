import React, { useState } from 'react';
import bgImage from "../assets/images/pub_background_1781992732386.jpg";
import logo from "../assets/images/agai_logo_1781992158822.jpg";

type LoginPageProps = {
  onLogin: () => void;
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="flex h-screen w-full items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-[-1] bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }}>
         <div className="absolute inset-0 bg-[#0B0D11]/90 backdrop-blur-sm"></div>
      </div>
      
      <div className="bg-[#15181E] border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl flex flex-col items-center">
         <img src={logo} alt="AGAI True Pub Logo" className="w-32 h-auto mb-8" />
         <h1 className="text-2xl font-bold text-gray-200 mb-6">Welcome Back</h1>
         
         <div className="w-full space-y-4">
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0B0D11] border border-gray-800 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-amber-500 text-gray-200"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0B0D11] border border-gray-800 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-amber-500 text-gray-200"
            />
            <button 
              onClick={onLogin}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Sign In
            </button>
         </div>
      </div>
    </div>
  );
}
