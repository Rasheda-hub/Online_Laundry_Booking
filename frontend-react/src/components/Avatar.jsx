import React from 'react'

export default function Avatar({ name = '', size = 24 }){
  const initials = (name || '').trim().split(/\s+/).slice(0,2).map(s=>s[0]?.toUpperCase()||'').join('') || '🙂'
  const styles = {
    width: size,
    height: size,
    fontSize: Math.max(10, Math.floor(size*0.45)),
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white"
      style={{
        ...styles,
        background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)'
      }}
      aria-label={`Avatar for ${name}`}
      title={name}
    >{initials}</span>
  )
}
