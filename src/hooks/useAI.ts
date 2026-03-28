"use client";

import { useState } from "react";

interface AIState<T> {
  loading: boolean;
  error: string | null;
  result: T | null;
}

export function useAI<T>() {
  const [state, setState] = useState<AIState<T>>({
    loading: false,
    error: null,
    result: null,
  });

  async function callAI(endpoint: string, body: object): Promise<T | null> {
    setState({ loading: true, error: null, result: null });
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        setState({
          loading: false,
          error: "You're generating too fast. Please wait a moment.",
          result: null,
        });
        return null;
      }

      if (!res.ok) {
        setState({
          loading: false,
          error: "AI is temporarily unavailable. You can still fill in manually.",
          result: null,
        });
        return null;
      }

      const data: T = await res.json();
      setState({ loading: false, error: null, result: data });
      return data;
    } catch {
      setState({
        loading: false,
        error: "AI is temporarily unavailable. You can still fill in manually.",
        result: null,
      });
      return null;
    }
  }

  function reset() {
    setState({ loading: false, error: null, result: null });
  }

  return { ...state, callAI, reset };
}
