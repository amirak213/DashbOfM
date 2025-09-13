"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ExternalLink, CheckCircle, XCircle } from "lucide-react"

interface EndpointTest {
  endpoint: string
  description: string
}

const endpoints: EndpointTest[] = [
  { endpoint: "/dashboard/stats", description: "Dashboard statistics" },
  { endpoint: "/dashboard/users?limit=10&offset=0", description: "Users list" },
  { endpoint: "/dashboard/sessions/active?hours=24", description: "Active sessions" },
  { endpoint: "/dashboard/analytics/daily?days=30", description: "Daily analytics" },
]

export function EndpointTester() {
  const [testResults, setTestResults] = useState<Record<string, { status: string; response: any; error?: string }>>({})
  const [isLoading, setIsLoading] = useState(false)

  const testEndpoint = async (endpoint: string) => {
    const baseUrl = localStorage.getItem("api-base-url")
    const apiPrefix = localStorage.getItem("api-prefix") || "/api/v1/chat"
    const fullUrl = `${baseUrl}${apiPrefix}${endpoint}`

    try {
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      const contentType = response.headers.get("content-type")
      const responseText = await response.text()

      let parsedResponse
      try {
        parsedResponse = JSON.parse(responseText)
      } catch {
        parsedResponse = responseText.substring(0, 200) + (responseText.length > 200 ? "..." : "")
      }

      return {
        status: response.ok ? "success" : "error",
        response: parsedResponse,
        contentType,
        statusCode: response.status,
        url: fullUrl,
      }
    } catch (error) {
      return {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        url: fullUrl,
      }
    }
  }

  const testAllEndpoints = async () => {
    setIsLoading(true)
    const results: Record<string, any> = {}

    for (const { endpoint } of endpoints) {
      results[endpoint] = await testEndpoint(endpoint)
    }

    setTestResults(results)
    setIsLoading(false)
  }

  const testSingleEndpoint = async (endpoint: string) => {
    setTestResults((prev) => ({ ...prev, [endpoint]: { status: "loading" } }))
    const result = await testEndpoint(endpoint)
    setTestResults((prev) => ({ ...prev, [endpoint]: result }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Endpoint Tester</CardTitle>
        <CardDescription>Test individual API endpoints to verify they're working correctly</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testAllEndpoints} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing All Endpoints...
            </>
          ) : (
            "Test All Endpoints"
          )}
        </Button>

        <div className="space-y-3">
          {endpoints.map(({ endpoint, description }) => {
            const result = testResults[endpoint]
            const baseUrl = localStorage.getItem("api-base-url")
            const apiPrefix = localStorage.getItem("api-prefix") || "/api/v1/chat"
            const fullUrl = `${baseUrl}${apiPrefix}${endpoint}`

            return (
              <div key={endpoint} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{description}</div>
                    <div className="text-sm text-muted-foreground font-mono">{endpoint}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result?.status === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {result?.status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
                    {result?.status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testSingleEndpoint(endpoint)}
                      disabled={result?.status === "loading"}
                    >
                      Test
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                {result && result.status !== "loading" && (
                  <div className="text-sm">
                    {result.status === "success" ? (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div>
                            <strong>Status:</strong> {result.statusCode} OK
                            <br />
                            <strong>Content-Type:</strong> {result.contentType}
                            <details className="mt-2">
                              <summary className="cursor-pointer">Response Data</summary>
                              <pre className="mt-1 p-2 bg-muted rounded overflow-auto text-xs">
                                {JSON.stringify(result.response, null, 2)}
                              </pre>
                            </details>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div>
                            {result.statusCode && (
                              <div>
                                <strong>Status:</strong> {result.statusCode}
                              </div>
                            )}
                            {result.error && (
                              <div>
                                <strong>Error:</strong> {result.error}
                              </div>
                            )}
                            {result.response && (
                              <details className="mt-2">
                                <summary className="cursor-pointer">Response</summary>
                                <pre className="mt-1 p-2 bg-muted rounded overflow-auto text-xs">
                                  {typeof result.response === "string"
                                    ? result.response
                                    : JSON.stringify(result.response, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
