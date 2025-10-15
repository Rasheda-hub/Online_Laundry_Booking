import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { updateMe, changePassword } from '../api/users.js'
import AddressAutocomplete from '../components/AddressAutocomplete.jsx'
import PasswordInput from '../components/PasswordInput.jsx'

export default function Profile(){
  const { user, token, setUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdErr, setPwdErr] = useState('')
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [editMode, setEditMode] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)

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
      setOk('Profile updated successfully!')
      setEditMode(false) // Close edit mode after successful save
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
      setPwdMsg('Password changed successfully!')
      setPwdForm({ current_password: '', new_password: '', confirm: '' })
      setShowPasswordForm(false)
    } catch (e){ setPwdErr(e.message) }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">👤 My Profile</h2>
            <div className="text-xs text-gray-600 mt-1 capitalize">🎯 Role: {user.role}</div>
          </div>
          <button onClick={()=>setEditMode(e=>!e)} className="btn-white text-sm">
            {editMode ? '❌ Cancel' : '✏️ Edit'}
          </button>
        </div>
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-3">⚠️ {error}</div>}
        {ok && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-3">✅ {ok}</div>}

        {!editMode && (
          <div className="space-y-3">
            {user.role === 'provider' ? (
              <>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">🏪 Shop Name</div>
                  <div className="font-medium">{user.shop_name || '-'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">📞 Contact Number</div>
                  <div className="font-medium">{user.contact_number || '-'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">📍 Shop Address</div>
                  <div className="font-medium">{user.shop_address || '-'}</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">👤 Full Name</div>
                  <div className="font-medium">{user.full_name || '-'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">📞 Contact Number</div>
                  <div className="font-medium">{user.contact_number || '-'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">📍 Address</div>
                  <div className="font-medium">{user.address || '-'}</div>
                </div>
              </>
            )}
          </div>
        )}

        {editMode && (
          <form onSubmit={onSave} className="space-y-4">
            {user.role === 'provider' ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">🏪 Shop Name *</label>
                  <input value={form.shop_name} onChange={e=>setForm({...form, shop_name:e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">📞 Contact Number *</label>
                  <input value={form.contact_number} onChange={e=>setForm({...form, contact_number:e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">📍 Shop Address *</label>
                  <AddressAutocomplete 
                    value={form.shop_address} 
                    onChange={(val)=>setForm({...form, shop_address:val})} 
                    placeholder="Start typing your shop address..." 
                    required 
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 Type at least 3 characters to search for addresses</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">👤 Full Name *</label>
                  <input value={form.full_name} onChange={e=>setForm({...form, full_name:e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">📞 Contact Number *</label>
                  <input value={form.contact_number} onChange={e=>setForm({...form, contact_number:e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">📍 Address *</label>
                  <AddressAutocomplete 
                    value={form.address} 
                    onChange={(val)=>setForm({...form, address:val})} 
                    placeholder="Start typing your address..." 
                    required 
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 Type at least 3 characters to search for addresses</p>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <button disabled={saving} className="btn-primary flex-1">{saving ? '⏳ Saving...' : '✅ Save Changes'}</button>
              <button type="button" onClick={()=>setEditMode(false)} className="btn-white flex-1">❌ Cancel</button>
            </div>
          </form>
        )}
      </div>
      
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">🔐 Change Password</h3>
          {!showPasswordForm && (
            <button 
              onClick={() => setShowPasswordForm(true)} 
              className="btn-primary text-sm"
            >
              🔑 Change Password
            </button>
          )}
        </div>
        
        {showPasswordForm && (
          <>
            {pwdErr && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-3">⚠️ {pwdErr}</div>}
            {pwdMsg && <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-3">✅ {pwdMsg}</div>}
            <form onSubmit={onChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password *</label>
                <PasswordInput 
                  value={pwdForm.current_password} 
                  onChange={e=>setPwdForm({...pwdForm, current_password:e.target.value})} 
                  placeholder="Enter current password" 
                  required 
                />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">New Password *</label>
                  <PasswordInput 
                    value={pwdForm.new_password} 
                    onChange={e=>setPwdForm({...pwdForm, new_password:e.target.value})} 
                    placeholder="Enter new password" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password *</label>
                  <PasswordInput 
                    value={pwdForm.confirm} 
                    onChange={e=>setPwdForm({...pwdForm, confirm:e.target.value})} 
                    placeholder="Confirm new password" 
                    required 
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1 md:flex-none">🔄 Update Password</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowPasswordForm(false)
                    setPwdForm({ current_password: '', new_password: '', confirm: '' })
                    setPwdErr('')
                    setPwdMsg('')
                  }} 
                  className="btn-white flex-1 md:flex-none"
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          </>
        )}
        
        {!showPasswordForm && (
          <p className="text-sm text-gray-600">Click the button above to change your password.</p>
        )}
      </div>
    </div>
  )
}
