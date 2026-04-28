"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthService } from "@/services/auth.service"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setIsLoading(true)

    const { error: resetError } = await AuthService.resetPassword(email)

    if (resetError) {
      setError(resetError)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)
  }

  if (success) {
    return (
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-[#10B981]" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
          <p className="text-gray-500">
            We&apos;ve sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
          </p>
        </div>
        <Link href="/login">
          <Button className="mt-4 bg-[#10B981] hover:bg-[#059669] text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Link 
          href="/login" 
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Login
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
        <p className="text-gray-500">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 pl-10"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-[#10B981] hover:bg-[#059669] text-white font-medium"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending...
            </span>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Remember your password?{" "}
        <Link href="/login" className="text-[#10B981] font-medium hover:text-[#059669]">
          Sign in
        </Link>
      </div>
    </div>
  )
}
