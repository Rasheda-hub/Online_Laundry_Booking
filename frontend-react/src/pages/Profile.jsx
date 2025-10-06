import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { updateMe, changePassword } from '../api/users.js'

export default function Profile(){
  const { user, token, setUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdErr, setPwdErr] = useState('')
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [editMode, setEditMode] = useState(false)

  const [form, setForm] = useState(()=>{
    if (!user) return {}
    if (user.role === 'provider'){
      return {
        shop_name: user.shop_name || '',
        contact_number: user.contact_number || '',
        shop_address: user.shop_address || '',
      }
    }
    return {
      full_name: user.full_name || '',
      contact_number: user.contact_number || '',
      address: user.address || '',
    }
  })

  useEffect(() => {
    if (!user) return
    if (user.role === 'provider'){
      setForm({
        shop_name: user.shop_name || '',
        contact_number: user.contact_number || '',
        shop_address: user.shop_address || '',
      })
    } else {
      setForm({
        full_name: user.full_name || '',
        contact_number: user.contact_number || '',
        address: user.address || '',
      })
    }
  }, [user])

  async function onSave(e){
    e.preventDefault()
    setError(''); setOk(''); setSaving(true)
    try {
      const updated = await updateMe(token, form)
      setUser(updated)
      setOk('Profile updated')
    } catch(e){ setError(e.message) } finally { setSaving(false) }
  }

  async function onChangePassword(e){
    e.preventDefault()
    setPwdErr(''); setPwdMsg('')
    if (!pwdForm.new_password || pwdForm.new_password !== pwdForm.confirm){
      setPwdErr('Passwords do not match');
      return
    }
    try {
      await changePassword(token, { current_password: pwdForm.current_password, new_password: pwdForm.new_password })
      setPwdMsg('Password changed')
      setPwdForm({ current_password: '', new_password: '', confirm: '' })
    } catch (e){ setPwdErr(e.message) }
  }

  if (!user) return null

  return (
    <div className="max-w-xl mx-auto card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">My Profile</h2>
        <button onClick={()=>setEditMode(e=>!e)} className="btn-white">{editMode ? 'Cancel' : 'Edit Profile'}</button>
      </div>
      <div className="text-xs opacity-60 mb-2">Role: {user.role}</div>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      {ok && <div className="text-sm text-green-700 mb-2">{ok}</div>}

      {!editMode && (
        <div className="space-y-2 text-sm">
          {user.role === 'provider' ? (
            <>
              <div><span className="opacity-70">Shop Name:</span> {user.shop_name || '-'}</div>
              <div><span className="opacity-70">Contact:</span> {user.contact_number || '-'}</div>
              <div><span className="opacity-70">Shop Address:</span> {user.shop_address || '-'}</div>
            </>
          ) : (
            <>
              <div><span className="opacity-70">Full Name:</span> {user.full_name || '-'}</div>
              <div><span className="opacity-70">Contact:</span> {user.contact_number || '-'}</div>
              <div><span className="opacity-70">Address:</span> {user.address || '-'}</div>
            </>
          )}
        </div>
      )}

      {editMode && (
        <form onSubmit={onSave} className="space-y-3">
          {user.role === 'provider' ? (
            <>
              <div>
                <label className="text-sm">Shop Name</label>
                <input value={form.shop_name} onChange={e=>setForm({...form, shop_name:e.target.value})} className="input" required />
              </div>
              <div>
                <label className="text-sm">Contact Number</label>
                <input value={form.contact_number} onChange={e=>setForm({...form, contact_number:e.target.value})} className="input" required />
              </div>
              <div>
                <label className="text-sm">Shop Address</label>
                <input value={form.shop_address} onChange={e=>setForm({...form, shop_address:e.target.value})} className="input" required />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm">Full Name</label>
                <input value={form.full_name} onChange={e=>setForm({...form, full_name:e.target.value})} className="input" required />
              </div>
              <div>
                <label className="text-sm">Contact Number</label>
                <input value={form.contact_number} onChange={e=>setForm({...form, contact_number:e.target.value})} className="input" required />
              </div>
              <div>
                <label className="text-sm">Address</label>
                <input value={form.address} onChange={e=>setForm({...form, address:e.target.value})} className="input" required />
              </div>
            </>
          )}
          <div className="flex gap-2">
            <button disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
            <button type="button" onClick={()=>setEditMode(false)} className="btn-white">Done</button>
          </div>
        </form>
      )}
      <hr className="my-5 border-t" />
      <h3 className="font-semibold mb-2">Change Password</h3>
      {pwdErr && <div className="text-sm text-red-600 mb-2">{pwdErr}</div>}
      {pwdMsg && <div className="text-sm text-green-700 mb-2">{pwdMsg}</div>}
      <form onSubmit={onChangePassword} className="space-y-3">
        <div>
          <label className="text-sm">Current Password</label>
          <input type="password" value={pwdForm.current_password} onChange={e=>setPwdForm({...pwdForm, current_password:e.target.value})} className="input" required />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">New Password</label>
            <input type="password" value={pwdForm.new_password} onChange={e=>setPwdForm({...pwdForm, new_password:e.target.value})} className="input" required />
          </div>
          <div>
            <label className="text-sm">Confirm Password</label>
            <input type="password" value={pwdForm.confirm} onChange={e=>setPwdForm({...pwdForm, confirm:e.target.value})} className="input" required />
          </div>
        </div>
        <button className="btn-white">Update Password</button>
      </form>
    </div>
  )
}
