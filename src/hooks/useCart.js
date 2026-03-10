// ============================================================
// MSME GROW POS - Cart Calculation Hook
// ============================================================

import { useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { calculateTax, calculateTotal } from '@/utils/format'

export const useCart = () => {
  const { cart, settings, cartAdd, cartUpdateQty, cartRemove, cartClear } = useApp()

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  )

  const taxAmount = useMemo(
    () => settings.taxEnabled ? calculateTax(subtotal, settings.taxRate) : 0,
    [subtotal, settings.taxEnabled, settings.taxRate]
  )

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart]
  )

  const total = useMemo(
    () => calculateTotal(subtotal, taxAmount, 0),
    [subtotal, taxAmount]
  )

  return {
    cart,
    subtotal,
    taxAmount,
    taxRate: settings.taxRate,
    taxEnabled: settings.taxEnabled,
    total,
    totalItems,
    isEmpty: cart.length === 0,
    cartAdd,
    cartUpdateQty,
    cartRemove,
    cartClear,
  }
}
