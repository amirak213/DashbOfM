"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function DebugInfo() {
  const [storageInfo, setStorageInfo] = useState<Record<string, string | null>>({})

  const refreshStorageInfo = () => {
    const info: Record<string, string | null> = {}

    // Check specific keys we care about
    const keys = ["api-base-url", "api-prefix"]
    keys.forEach((key) => {
      info[key] = localStorage.getItem(key)
    })

    // Get all localStorage keys properly
    const allKeys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) allKeys.push(key)
    }
    info["all_keys"] = allKeys.join(", ") || "none"
    info["localStorage_length"] = localStorage.length.toString()

    console.log("Debug info refreshed:", info)
    setStorageInfo(info)
  }

  useEffect(() => {
    refreshStorageInfo()

    // Also refresh every 2 seconds to catch any changes
    const interval = setInterval(refreshStorageInfo, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Debug Information</CardTitle>
        <CardDescription>Current localStorage values (auto-refreshing)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">localStorage Debug</span>
          <Button variant="outline" size="sm" onClick={refreshStorageInfo}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>

        <div className="text-xs space-y-1 font-mono">
          <div>
            <strong>api-base-url:</strong> {storageInfo["api-base-url"] || "NOT SET"}
          </div>
          <div>
            <strong>api-prefix:</strong> {storageInfo["api-prefix"] || "NOT SET"}
          </div>
          <div>
            <strong>localStorage.length:</strong> {storageInfo["localStorage_length"]}
          </div>
          <div>
            <strong>All keys:</strong> {storageInfo["all_keys"]}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>If values show but keys show "none", there might be a localStorage issue.</p>
        </div>
      </CardContent>
    </Card>
  )
}
