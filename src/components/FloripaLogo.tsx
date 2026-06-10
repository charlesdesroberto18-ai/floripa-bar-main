/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface FloripaLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function FloripaLogo({ className = '', size = 56, showText = false }: FloripaLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className="relative shrink-0 select-none shadow-lg rounded-full" 
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Sunset/Ocean Gradient Definition */}
          <defs>
            <linearGradient id="sunsetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF2E5" />
              <stop offset="40%" stopColor="#FB923C" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#7A1616" />
            </linearGradient>
          </defs>

          {/* Outer Brand Ring */}
          <circle cx="100" cy="100" r="96" fill="#7A1616" stroke="url(#ringGrad)" strokeWidth="4" />
          
          {/* Inner Sunset Circle */}
          <circle cx="100" cy="100" r="84" fill="url(#sunsetGrad)" />

          {/* Stylized Waves Silhouette (A Maré) */}
          <path 
            d="M 16 130 Q 50 110 84 130 T 152 130 T 184 130 L 184 184 L 16 184 Z" 
            fill="#5C0E0E" 
          />
          <path 
            d="M 16 145 Q 50 125 84 145 T 152 145 T 184 145 L 184 184 L 16 184 Z" 
            fill="#400606" 
            opacity="0.6"
          />

          {/* Brand Stylized text within circular badge */}
          <text 
            x="100" 
            y="110" 
            textAnchor="middle" 
            fill="#F59E0B" 
            fontWeight="bold" 
            fontSize="26" 
            fontFamily="Impact, Georgia, serif"
            letterSpacing="0.5"
            style={{ textShadow: '2px 2px 2.5px rgba(0,0,0,0.85)' }}
          >
            FLORIPA
          </text>
          
          <text 
            x="100" 
            y="140" 
            textAnchor="middle" 
            fill="#FFF2E5" 
            fontWeight="medium" 
            fontSize="14" 
            fontFamily="sans-serif"
            letterSpacing="3"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}
          >
            BAR
          </text>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-display text-lg font-extrabold tracking-tight text-white leading-none">
            FLORIPA <span className="text-brand-gold">BAR</span>
          </span>
        </div>
      )}
    </div>
  );
}
