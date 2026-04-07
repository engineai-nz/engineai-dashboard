'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

type TenantContextType = {
  user: User | null
  tenantId: string | null
  loading: boolean
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        setTenantId(session?.user?.user_metadata?.tenant_id ?? null)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null)
        setTenantId(session?.user?.user_metadata?.tenant_id ?? null)
        setLoading(false)
      },
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <TenantContext.Provider value={{ user, tenantId, loading }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}
