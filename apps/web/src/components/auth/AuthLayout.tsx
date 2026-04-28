"use client"

import { ReactNode } from "react"
import { BookOpen, Library } from "lucide-react"

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Section - Library Image with Overlay */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900">
        {/* Background Image Placeholder - in production use actual library image */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="absolute inset-0 opacity-30">
            <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-600 via-gray-800 to-gray-900" />
          </div>
        </div>
        
        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <div className="mb-6">
            <div className="w-12 h-12 bg-[#10B981] rounded-lg flex items-center justify-center mb-6">
              <Library className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Your Campus Study Space,<br />
            Simplified.
          </h1>
          <p className="text-gray-300 text-lg max-w-md leading-relaxed">
            Reserve your preferred seat, check availability in real-time, and manage your study sessions effortlessly.
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-8 left-8">
          <div className="flex items-center gap-2 text-white/80">
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">E-Library Space</span>
          </div>
        </div>
      </div>

      {/* Right Section - Auth Form */}
      <div className="flex-1 flex items-center justify-center bg-white p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-[#10B981] rounded-lg flex items-center justify-center">
              <Library className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">E-Library Space</span>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  )
}
