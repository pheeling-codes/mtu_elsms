"use client"

import { useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

interface UseRealtimeOptions {
  table: string
  event?: "INSERT" | "UPDATE" | "DELETE" | "*"
  filter?: string
  onChange: (payload: { new: unknown; old: unknown; event: string }) => void
}

export function useRealtime({ table, event = "*", filter, onChange }: UseRealtimeOptions) {
  const handleChange = useCallback(
    (payload: { new: unknown; old: unknown; event: string }) => {
      onChange(payload)
    },
    [onChange]
  )

  useEffect(() => {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        "postgres_changes",
        { event, schema: "public", table, filter },
        handleChange
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [table, event, filter, handleChange])
}
