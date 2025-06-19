import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "default" | "success" | "error" | "warning" | "info"

export interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose?: () => void
}

export const Toast = ({ message, type = "default", duration = 3000, onClose }: ToastProps) => {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose?.()
    }, 300) // Match this with the transition duration
  }

  const toastClasses = cn(
    "relative flex items-center w-full max-w-xs p-4 mb-2 rounded-lg shadow-lg",
    "border border-border bg-background text-foreground",
    "transition-all duration-300 ease-in-out",
    isClosing ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
    {
      "border-primary": type === "default",
      "border-green-500": type === "success",
      "border-destructive": type === "error",
      "border-yellow-500": type === "warning",
      "border-blue-500": type === "info",
    }
  )

  const iconClasses = cn("mr-2", {
    "text-primary": type === "default",
    "text-green-500": type === "success",
    "text-destructive": type === "error",
    "text-yellow-500": type === "warning",
    "text-blue-500": type === "info",
  })

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg
            className={iconClasses}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
          </svg>
        )
      case "error":
        return (
          <svg
            className={iconClasses}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
        )
      case "warning":
        return (
          <svg
            className={iconClasses}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        )
      case "info":
        return (
          <svg
            className={iconClasses}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        )
      default:
        return (
          <svg
            className={iconClasses}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        )
    }
  }

  return (
    <div className={toastClasses}>
      {getIcon()}
      <div className="flex-1">{message}</div>
      <button
        onClick={handleClose}
        className="p-1 rounded-full hover:bg-muted transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}