import { toast as sonnerToast } from "sonner"

interface ToastOptions {
  title: string
  description?: string
  variant?: "default" | "destructive" | "success"
}

export function toast({ title, description, variant = "default" }: ToastOptions) {
  if (variant === "destructive") {
    sonnerToast.error(title, {
      description,
    })
  } else if (variant === "success") {
    sonnerToast.success(title, {
      description,
    })
  } else {
    sonnerToast(title, {
      description,
    })
  }
}

export async function withToast<T>(
  promise: Promise<T>,
  {
    loading = "Loading...",
    success = "Success!",
    error = "Something went wrong",
  }: {
    loading?: string
    success?: string | ((data: T) => string)
    error?: string | ((err: Error) => string)
  } = {}
): Promise<T | null> {
  try {
    const result = await promise
    const successMessage = typeof success === "function" ? success(result) : success
    toast({ title: successMessage, variant: "success" })
    return result
  } catch (err) {
    const errorMessage = typeof error === "function" ? error(err as Error) : error
    toast({ title: errorMessage, variant: "destructive" })
    return null
  }
}
