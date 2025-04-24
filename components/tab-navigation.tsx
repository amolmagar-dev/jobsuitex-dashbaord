"use client"

import { usePathname, useRouter } from "next/navigation"

export function TabNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  
  const tabs = [
    { name: "Overview", path: "/" },
    { name: "Services", path: "/services" }
  ]
  
  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") {
      return true
    }
    return path !== "/" && pathname.startsWith(path)
  }
  
  return (
    <div className="inline-flex bg-muted/20 rounded-lg p-1">
      {tabs.map((tab) => (
        <button
          key={tab.name}
          onClick={() => router.push(tab.path)}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            isActive(tab.path) 
              ? "bg-background text-foreground font-medium shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.name}
        </button>
      ))}
    </div>
  )
}