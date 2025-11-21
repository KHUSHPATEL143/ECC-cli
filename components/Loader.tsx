import React from 'react';

export const Loader: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 border-4 border-navy-800 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-gold-500 rounded-full border-t-transparent animate-spin"></div>
    </div>
    {text && <p className="text-gold-500 font-body text-sm tracking-widest animate-pulse">{text}</p>}
  </div>
);
