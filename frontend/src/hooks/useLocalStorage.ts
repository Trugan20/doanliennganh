import { useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (err) {
      console.error(`useLocalStorage error for key "${key}":`, err)
    }
  }

  const removeValue = () => {
    try {
      localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (err) {
      console.error(`useLocalStorage removeValue error for key "${key}":`, err)
    }
  }

  return [storedValue, setValue, removeValue] as const
}