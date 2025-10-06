import React from 'react'

export default function Bubbles(){
  return (
    <div className="bubbles">
      {[...Array(12)].map((_,i)=>{
        const size = 40 + Math.round(Math.random()*80)
        const top = Math.round(Math.random()*90)
        const left = Math.round(Math.random()*90)
        const delay = Math.random()*3
        return (
          <div key={i}
               className="bubble animate-float"
               style={{width:size, height:size, top:`${top}%`, left:`${left}%`, animationDelay:`${delay}s`}} />
        )
      })}
    </div>
  )
}
