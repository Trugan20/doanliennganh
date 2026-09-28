import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Role, User } from '../types'

interface AuthContextType {
  token: string | null
  role: Role | null
  user: User | null
  login: (token: string, role: Role, user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [role, setRole] = useState<Role | null>(() => localStorage.getItem('role') as Role | null)
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })

  const login = (t: string, r: Role, u: User) => {
    localStorage.setItem('token', t)
    localStorage.setItem('role', r)
    localStorage.setItem('user', JSON.stringify(u))
    setToken(t)
    setRole(r)
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
    setToken(null)
    setRole(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, role, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}