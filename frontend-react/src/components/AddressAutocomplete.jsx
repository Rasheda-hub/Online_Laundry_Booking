import React, { useState, useEffect, useRef } from 'react'

export default function AddressAutocomplete({ value, onChange, placeholder, required }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [apiError, setApiError] = useState('')
  const wrapperRef = useRef(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    if (!value || value.length < 3) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      await searchAddress(value)
    }, 500)

    return () => clearTimeout(timer)
  }, [value])

  const searchAddress = async (query) => {
    try {
      setLoading(true)
      setApiError('')
      
      console.log('Searching for:', query)
      
      // Call backend proxy to avoid CORS issues
      const response = await fetch(
        `/places/autocomplete?q=${encodeURIComponent(query)}`
      )

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', errorData)
        throw new Error(errorData.detail || `Failed to fetch addresses (${response.status})`)
      }
      
      const data = await response.json()
      console.log('Received data:', data)
      
      if (data && Array.isArray(data) && data.length > 0) {
        setSuggestions(data)
        setShowSuggestions(true)
      } else {
        setSuggestions([])
        setShowSuggestions(true)
      }
      
    } catch (error) {
      console.error('Address search error:', error)
      setApiError(error.message)
      setSuggestions([])
      setShowSuggestions(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (suggestion) => {
    // Format address from Nominatim data
    const address = formatAddress(suggestion)
    onChange(address)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const formatAddress = (suggestion) => {
    const addr = suggestion.address || {}
    const parts = []
    
    // Add specific location details
    if (addr.suburb || addr.neighbourhood) {
      parts.push(addr.suburb || addr.neighbourhood)
    } else if (addr.village || addr.hamlet) {
      parts.push(addr.village || addr.hamlet)
    } else if (addr.road) {
      parts.push(addr.road)
    }
    
    // Add city/municipality
    if (addr.city) {
      parts.push(addr.city)
    } else if (addr.town) {
      parts.push(addr.town)
    } else if (addr.municipality) {
      parts.push(addr.municipality)
    }
    
    // Add province - keep Tawi-Tawi fixed if present
    if (addr.state || addr.province) {
      const province = addr.state || addr.province
      // Ensure Tawi-Tawi stays as is
      parts.push(province)
    }
    
    return parts.length > 0 ? parts.join(', ') : suggestion.display_name
  }

  const formatDisplayText = (suggestion) => {
    const addr = suggestion.address || {}
    const parts = []
    
    if (addr.suburb || addr.neighbourhood) {
      parts.push(addr.suburb || addr.neighbourhood)
    }
    if (addr.city || addr.town || addr.municipality) {
      parts.push(addr.city || addr.town || addr.municipality)
    }
    if (addr.state || addr.province) {
      parts.push(addr.state || addr.province)
    }
    
    return parts.length > 0 ? parts.join(', ') : suggestion.display_name.split(',')[0]
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input pr-10"
          required={required}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-bubble-dark border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id || index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">📍</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {formatDisplayText(suggestion)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {suggestion.display_name}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && !loading && value.length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm">
          {apiError ? (
            <div className="text-red-600">
              <div className="font-medium">⚠️ Error</div>
              <div className="mt-1">{apiError}</div>
            </div>
          ) : (
            <div className="text-gray-500">
              No addresses found. Try a different search term.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
