import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerCustomer, registerProvider } from '../api/users.js'

export default function Register(){
  const nav = useNavigate()
  const [tab, setTab] = useState('customer')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Customer fields
  const [cFullName, setCFullName] = useState('')
  const [cEmail, setCEmail] = useState('')
  const [cPassword, setCPassword] = useState('')
  const [cContact, setCContact] = useState('')
  const [cAddress, setCAddress] = useState('')

  // Provider fields
  const [pShopName, setPShopName] = useState('')
  const [pEmail, setPEmail] = useState('')
  const [pPassword, setPPassword] = useState('')
  const [pContact, setPContact] = useState('')
  const [pShopAddress, setPShopAddress] = useState('')

  async function onSubmit(e){
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (tab === 'customer'){
        await registerCustomer({
          full_name: cFullName,
          email: cEmail,
          password: cPassword,
          contact_number: cContact,
          address: cAddress,
        })
      } else {
        await registerProvider({
          shop_name: pShopName,
          email: pEmail,
          password: pPassword,
          contact_number: pContact,
          shop_address: pShopAddress,
        })
      }
      nav('/login')
    } catch (err){
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto card">
      <h2 className="text-xl font-semibold mb-4 text-center">Create Account</h2>
      <div className="flex justify-center gap-3 mb-4">
        <button onClick={()=>setTab('customer')} className={`btn ${tab==='customer'?'bg-bubble-dark text-white':'btn-white'}`}>Customer</button>
        <button onClick={()=>setTab('provider')} className={`btn ${tab==='provider'?'bg-bubble-dark text-white':'btn-white'}`}>Service Provider</button>
      </div>
      {error && <div className="mb-3 text-sm text-red-600 text-center">{error}</div>}
      <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-3">
        {tab==='customer' ? (
          <>
            <input value={cFullName} onChange={e=>setCFullName(e.target.value)} placeholder="Full name" className="input" required />
            <input type="email" value={cEmail} onChange={e=>setCEmail(e.target.value)} placeholder="Email" className="input" required />
            <input type="password" value={cPassword} onChange={e=>setCPassword(e.target.value)} placeholder="Password" className="input" required />
            <input value={cContact} onChange={e=>setCContact(e.target.value)} placeholder="Contact number" className="input" required />
            <input value={cAddress} onChange={e=>setCAddress(e.target.value)} placeholder="Address" className="input md:col-span-2" required />
          </>
        ) : (
          <>
            <input value={pShopName} onChange={e=>setPShopName(e.target.value)} placeholder="Shop name" className="input" required />
            <input type="email" value={pEmail} onChange={e=>setPEmail(e.target.value)} placeholder="Email" className="input" required />
            <input type="password" value={pPassword} onChange={e=>setPPassword(e.target.value)} placeholder="Password" className="input" required />
            <input value={pContact} onChange={e=>setPContact(e.target.value)} placeholder="Contact number" className="input" required />
            <input value={pShopAddress} onChange={e=>setPShopAddress(e.target.value)} placeholder="Shop address" className="input md:col-span-2" required />
          </>
        )}
        <button disabled={loading} className="mt-2 md:col-span-2 btn-primary">{loading ? 'Creating...' : 'Sign Up'}</button>
      </form>
      <div className="mt-4 text-sm text-center">
        Already have an account? <a href="#" onClick={(e)=>{e.preventDefault(); nav('/login')}} className="underline">Login</a>
      </div>
    </div>
  )
}
