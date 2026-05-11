import { useEffect, useRef, useState } from "react"
import { getApiBaseUrl } from "@/lib/auth/api-client"

export interface WSEvent<T = unknown> {
  type: string
  payload: T
  at: string
}

function buildWsUrl(token: string): string {
  const base = getApiBaseUrl()
  // http -> ws, https -> wss
  const wsBase = base.replace(/^http/, "ws")
  return `${wsBase}/ws?token=${encodeURIComponent(token)}`
}

/**
 * useWebSocket — подключается к /ws с JWT-токеном из localStorage,
 * автоматически переподключается с экспоненциальной задержкой.
 */
export function useWebSocket(onEvent: (ev: WSEvent) => void) {
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef(0)
  const handlerRef = useRef(onEvent)

  // Обновляем последний handler без пересоздания подключения
  useEffect(() => {
    handlerRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    let stopped = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      if (stopped) return
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      if (!token) return

      const ws = new WebSocket(buildWsUrl(token))
      wsRef.current = ws

      ws.onopen = () => {
        retryRef.current = 0
        setConnected(true)
      }
      ws.onmessage = (e) => {
        try {
          const ev = JSON.parse(e.data) as WSEvent
          handlerRef.current(ev)
        } catch {
          // ignore malformed
        }
      }
      ws.onclose = () => {
        setConnected(false)
        if (stopped) return
        const delay = Math.min(1000 * 2 ** retryRef.current, 15_000)
        retryRef.current += 1
        retryTimer = setTimeout(connect, delay)
      }
      ws.onerror = () => ws.close()
    }

    connect()
    return () => {
      stopped = true
      if (retryTimer) clearTimeout(retryTimer)
      wsRef.current?.close()
    }
  }, [])

  return { connected }
}
