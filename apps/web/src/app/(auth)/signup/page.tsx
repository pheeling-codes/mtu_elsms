"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, ArrowRight, GraduationCap, Shield, BookOpen, Loader2, User, Lock, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthService } from "@/services/auth.service"
import { Role } from "@elsms/types"

export default function SignupPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>("STUDENT" as Role)
  const [email, setEmail] = useState("")
  const [matricNumber, setMatricNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (role === "STUDENT" && !matricNumber.trim()) {
      setError("Matric number is required for students")
      return
    }

    setIsLoading(true)

    const { user, error: authError } = await AuthService.signUp({
      email,
      password,
      matricNumber: role === "STUDENT" ? matricNumber : undefined,
      role,
    })

    if (authError) {
      setError(authError)
      setIsLoading(false)
      return
    }

    setSuccess("Account created successfully! Please check your email to verify your account.")
    setIsLoading(false)

    // Redirect after a short delay
    setTimeout(() => {
      router.push("/login")
    }, 3000)
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
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Join the Study Hub</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Create your account to start reserving seats and managing your study sessions.
        </p>
      </div>

      {/* Role Selector */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">I am a</Label>
        <Tabs value={role} onValueChange={(v) => setRole(v as Role)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="STUDENT" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Student
            </TabsTrigger>
            <TabsTrigger value="ADMIN" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Administrator
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {role === "STUDENT" && (
          <div className="space-y-2">
            <Label htmlFor="matricNumber" className="text-sm font-medium text-gray-700">
              Matric Number
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="matricNumber"
                type="text"
                placeholder="e.g. MAT/19/1234"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
                required={role === "STUDENT"}
                className="h-12 pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#10B981] focus:ring-[#10B981]/20 transition-all"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            {role === "STUDENT" ? "Institutional Email" : "Staff Email"}
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder={role === "STUDENT" ? "student@university.edu" : "admin@university.edu"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#10B981] focus:ring-[#10B981]/20 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-12 pl-10 pr-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#10B981] focus:ring-[#10B981]/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
            Confirm Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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

        {success && (
          <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm">
            {success}
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
              <span className="animate-pulse">Creating account...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Create Account
              <ArrowRight className="w-5 h-5" />
            </span>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center space-y-4 pt-4">
        <div className="text-sm text-gray-500">
          Already have an account?{" "}
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
