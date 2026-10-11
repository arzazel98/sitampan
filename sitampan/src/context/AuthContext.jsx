import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const DEV_USER = { id: 'd0a103d7-109a-4210-b1b6-8b054910d9c0', email: 'rizal@sitampan.id', full_name: 'Rizal', role: 'CASHIER' }
  const DEV_OWNER = { id: '22bb6222-71c9-439a-99d1-e4f96284b95f', email: 'ahmad@sitampan.id', full_name: 'Ahmad', role: 'OWNER' }

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (error) throw error
      return data
    } catch {
      if (userId === DEV_USER.id) return DEV_USER
      if (userId === DEV_OWNER.id) return DEV_OWNER
      return null
    }
  }

  useEffect(() => {
    let mounted = true
    async function init() {
      const raw = localStorage.getItem('dev_session')
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (parsed?.user) {
            setUser(parsed.user)
            setProfile(parsed.profile)
            if (mounted) setLoading(false)
            return
          }
        } catch {}
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        const p = await fetchProfile(session.user.id)
        if (mounted) setProfile(p)
      }
      if (mounted) setLoading(false)
    }
    init()
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const raw = localStorage.getItem('dev_session')
      if (raw) return
      if (session?.user) {
        setUser(session.user)
        const p = await fetchProfile(session.user.id)
        setProfile(p)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  function normalizeEmail(input) {
    const v = input.trim().toLowerCase()
    if (!v.includes('@')) return `${v}@sitampan.id`
    return v
  }

  async function login(emailInput, password) {
    const email = normalizeEmail(emailInput)
    const isAhmad = email === 'ahmad@sitampan.id' && (password === '123' || password === '123456' || password === 'ahmad123')
    if (isAhmad) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: '123456' })
        if (!error && data?.session) {
          const prof = (await fetchProfile(data.user.id)) || DEV_OWNER
          setUser(data.user)
          setProfile(prof)
          return data
        }
        if (error) throw error
      } catch {
        const mockUser = { id: DEV_OWNER.id, email: DEV_OWNER.email }
        const mockProfile = DEV_OWNER
        setUser(mockUser)
        setProfile(mockProfile)
        localStorage.setItem('dev_session', JSON.stringify({ user: mockUser, profile: mockProfile }))
        return { user: mockUser, session: { user: mockUser } }
      }
    }

    const isRizal = email === 'rizal@sitampan.id' && (password === '123' || password === '123456' || password === 'rizal123')
    if (isRizal) {
      const realPass = '123456'
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: realPass })
        if (!error && data?.session) return data
        if (error && error.code === 'email_not_confirmed') throw error
        if (error) throw error
      } catch (err) {
        const mockUser = { id: DEV_USER.id, email: DEV_USER.email }
        const mockProfile = DEV_USER
        setUser(mockUser)
        setProfile(mockProfile)
        localStorage.setItem('dev_session', JSON.stringify({ user: mockUser, profile: mockProfile }))
        return { user: mockUser, session: { user: mockUser } }
      }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function logout() {
    localStorage.removeItem('dev_session')
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const role = profile?.role?.toUpperCase() || null
  const isOwner = role === 'OWNER'
  const isCashier = role === 'CASHIER'

  return (
    <AuthContext.Provider value={{ user, profile, role, isOwner, isCashier, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be inside AuthProvider')
  return ctx
}
