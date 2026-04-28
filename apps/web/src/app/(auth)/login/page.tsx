"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, ArrowRight, GraduationCap, Shield, BookOpen, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthService, syncSessionToCookies } from "@/services/auth.service"
import { useToast } from "@/hooks/use-toast"
import { Role } from "@elsms/types"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [role, setRole] = useState<Role>("STUDENT" as Role)
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const { user, error: authError } = await AuthService.signIn({
        identifier,
        password,
        role,
      })

      if (authError || !user) {
        const errorMsg = authError || "Authentication failed"
        setError(errorMsg)
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: errorMsg,
        })
        setIsLoading(false)
        return
      }

      // Sync Supabase session from localStorage to cookies (CRITICAL for middleware detection)
      syncSessionToCookies()

      // Set role cookie for middleware detection - use explicit path and no domain
      const cookieValue = `user-role=${user.role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      document.cookie = cookieValue;
      
      // Also store in localStorage as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem('user-role', user.role);
      }
      
      // Show success toast with Emerald theme
      const dashboardName = user.role === "ADMIN" ? "Admin Dashboard" : "Student Dashboard"
      toast({
        variant: "success",
        title: "Welcome back!",
        description: `Redirecting you to your ${dashboardName}...`,
      })
      
      // Step 3: Refresh router to re-run middleware with new cookies
      router.refresh()
      
      // Step 4: 1000ms delay to allow toast and session to propagate
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Step 5: Navigate to dashboard
      const dashboardUrl = user.role === "ADMIN" ? "/admin" : "/dashboard"
      window.location.href = dashboardUrl
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMsg)
      toast({
        variant: "destructive",
        title: "Login Error",
        description: errorMsg,
      })
      setIsLoading(false)
    }
  }

  const identifierLabel = role === "STUDENT" ? "Matric Number" : "Staff Email"
  const identifierPlaceholder = role === "STUDENT" ? "e.g. MAT/19/1234" : "admin@university.edu"

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-[#10B981] rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-900">ELSMS</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
        <p className="text-gray-500">
          Log in with your credentials to access the E-Library Space reservation system.
        </p>
      </div>

      {/* Role Selector */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">Select Role</Label>
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="identifier" className="text-sm font-medium text-gray-700">
            {identifierLabel}
          </Label>
          <Input
            id="identifier"
            type="text"
            placeholder={identifierPlaceholder}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-sm text-[#10B981] hover:text-[#059669] transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
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
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Login to Dashboard
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center space-y-2">
        <div className="text-sm text-gray-500">
          Don't have an account?{" "}
          <Link href="/signup" className="text-[#10B981] font-medium hover:text-[#059669] transition-colors">
            Sign up
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          © {new Date().getFullYear()} E-Library Space Management System
        </p>
      </div>
    </div>
  )
}
