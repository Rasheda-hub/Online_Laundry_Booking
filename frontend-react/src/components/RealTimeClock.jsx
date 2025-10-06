import React, { useState, useEffect } from 'react'

export default function RealTimeClock({ className = '' }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={className}>
      {time.toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })}
    </div>
  )
}

// Utility function to format dates consistently
export function formatDateTime(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

// Utility function to get current PH time
export function getCurrentPHTime() {
  return new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })
}
