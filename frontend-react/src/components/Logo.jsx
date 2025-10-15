import React from 'react'

export default function Logo({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const sizeClass = sizes[size] || sizes.md

  return (
    <div className={`inline-flex ${sizeClass} rounded-full bg-gradient-to-br from-bubble-dark to-bubble-mid items-center justify-center shadow-sm overflow-hidden ${className}`}>
      {/* Custom logo image - zoomed to fill circle */}
      <img src="/logo.png" alt="Logo" className="w-[120%] h-[120%] object-cover" />
    </div>
  )
}
