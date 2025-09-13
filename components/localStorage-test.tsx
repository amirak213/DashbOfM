"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LocalStorageTest() {
  const [testValue, setTestValue] = useState("")
  const [storedValue, setStoredValue] = useState("")
  const [apiUrl, setApiUrl] = useState("")
  const [apiPrefix, setApiPrefix] = useState("")

  const refreshValues = () => {
    const stored = localStorage.getItem("test-key") || ""
    const url = localStorage.getItem("api-base-url") || ""
    const prefix = localStorage.getItem("api-prefix") || ""

    setStoredValue(stored)
    setApiUrl(url)
    setApiPrefix(prefix)

    console.log("LocalStorage test refresh:")
    console.log("test-key:", stored)
    console.log("api-base-url:", url)
    console.log("api-prefix:", prefix)
  }

  const setTestKey = () => {
    localStorage.setItem("test-key", testValue)
    refreshValues()
  }

  const clearAll = () => {
    localStorage.clear()
    refreshValues()
  }

  const setApiValues = () => {
    localStorage.setItem("api-base-url", "http://51.38.234.197:8000")
    localStorage.setItem("api-prefix", "/api/v1/chat")
    refreshValues()
  }

  useEffect(() => {
    refreshValues()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>localStorage Test</CardTitle>
        <CardDescription>Test localStorage functionality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Test Value:</label>
          <div className="flex gap-2">
            <Input value={testValue} onChange={(e) => setTestValue(e.target.value)} placeholder="Enter test value" />
            <Button onClick={setTestKey}>Set</Button>
          </div>
        </div>

        <div className="space-y-2">
          <Button onClick={setApiValues} className="w-full">
            Set API Values
          </Button>
          <Button onClick={clearAll} variant="outline" className="w-full bg-transparent">
            Clear All
          </Button>
          <Button onClick={refreshValues} variant="outline" className="w-full bg-transparent">
            Refresh
          </Button>
        </div>

        <Alert>
          <AlertDescription>
            <div className="space-y-1 text-xs font-mono">
              <div>
                <strong>test-key:</strong> {storedValue || "NOT SET"}
              </div>
              <div>
                <strong>api-base-url:</strong> {apiUrl || "NOT SET"}
              </div>
              <div>
                <strong>api-prefix:</strong> {apiPrefix || "NOT SET"}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
