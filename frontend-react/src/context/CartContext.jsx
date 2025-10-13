import React, { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    // Load cart from localStorage
    try {
      const saved = localStorage.getItem('laundry_cart')
      return saved ? JSON.parse(saved) : { providerId: null, providerName: null, items: [] }
    } catch {
      return { providerId: null, providerName: null, items: [] }
    }
  })

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('laundry_cart', JSON.stringify(cart))
    } catch (err) {
      console.error('Failed to save cart:', err)
    }
  }, [cart])

  // Add item to cart
  const addToCart = (provider, category, weight) => {
    // If cart has items from different provider, clear it first
    if (cart.providerId && cart.providerId !== provider.id) {
      if (!window.confirm(`You have items from ${cart.providerName}. Clear cart and add from ${provider.shop_name}?`)) {
        return false
      }
      setCart({ providerId: provider.id, providerName: provider.shop_name, items: [] })
    }

    const newItem = {
      id: Date.now(), // Temporary ID for cart item
      categoryId: category.id,
      categoryName: category.name,
      pricingType: category.pricing_type,
      price: category.price,
      minKilo: category.min_kilo,
      maxKilo: category.max_kilo,
      weight: parseFloat(weight),
      subtotal: calculateItemPrice(category, parseFloat(weight))
    }

    setCart({
      providerId: provider.id,
      providerName: provider.shop_name,
      providerEmail: provider.email,
      providerContact: provider.contact_number,
      items: [...cart.items, newItem]
    })

    return true
  }

  // Calculate price for a single item
  const calculateItemPrice = (category, weight) => {
    if (category.pricing_type === 'per_kilo') {
      return category.price * weight
    } else {
      // Fixed price - multiply if weight exceeds max
      if (category.max_kilo && weight > category.max_kilo) {
        const numBatches = Math.ceil(weight / category.max_kilo)
        return category.price * numBatches
      }
      return category.price
    }
  }

  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCart({
      ...cart,
      items: cart.items.filter(item => item.id !== itemId)
    })
  }

  // Update item weight
  const updateItemWeight = (itemId, newWeight) => {
    setCart({
      ...cart,
      items: cart.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            weight: parseFloat(newWeight),
            subtotal: calculateItemPrice(item, parseFloat(newWeight))
          }
        }
        return item
      })
    })
  }

  // Clear entire cart
  const clearCart = () => {
    setCart({ providerId: null, providerName: null, items: [] })
  }

  // Get cart totals
  const getCartTotal = () => {
    return cart.items.reduce((sum, item) => sum + item.subtotal, 0)
  }

  const getCartItemCount = () => {
    return cart.items.length
  }

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateItemWeight,
    clearCart,
    getCartTotal,
    getCartItemCount
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
