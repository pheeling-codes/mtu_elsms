"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, CheckCircle, BookOpen, Loader2, ArrowRight } from "lucide-react"

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
          <Button className="mt-4 bg-[#10B981] hover:bg-[#059669] text-white font-semibold">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header - E-Library Space Branding */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#10B981] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-900">E-Library Space</span>
        </div>
        <Link 
          href="/login" 
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Login
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reset your password</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email or Matric Number
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="email"
              type="text"
              placeholder="Enter your email or matric number"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#10B981] focus:ring-[#10B981]/20 transition-all"
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
          className="w-full h-12 bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-lg shadow-lg shadow-emerald-200/50 transition-all hover:shadow-xl hover:shadow-emerald-200/60 active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="animate-pulse">Sending...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Send Recovery Link
              <ArrowRight className="w-5 h-5" />
            </span>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center space-y-4 pt-4">
        <div className="text-sm text-gray-500">
          Remember your password?{" "}
          <Link href="/login" className="text-[#10B981] font-semibold hover:text-[#059669] transition-colors">
            Sign in
          </Link>
        </div>
        <p className="text-xs text-gray-400">
          Need help?{" "}
          <Link href="/contact" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Contact Admin
          </Link>
        </p>
      </div>
    </div>
  )
}
