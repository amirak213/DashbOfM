"use client"

import { LocalStorageTest } from "@/components/localStorage-test"

export default function TestPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LocalStorageTest />
      </div>
    </main>
  )
}
