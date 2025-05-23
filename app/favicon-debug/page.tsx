"use client";
import React from "react";
import Image from "next/image";

export default function FaviconDebugPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-8">Favicon Debug Page</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl">
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2">favicon.ico</h2>
          <div className="border border-gray-200 p-4 rounded-lg">
            <Image
              src="/favicon.ico"
              alt="favicon.ico"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2">favicon-96x96.png</h2>
          <div className="border border-gray-200 p-4 rounded-lg">
            <Image
              src="/favicon-96x96.png"
              alt="favicon-96x96.png"
              width={96}
              height={96}
              className="object-contain"
            />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2">apple-touch-icon.png</h2>
          <div className="border border-gray-200 p-4 rounded-lg">
            <Image
              src="/favicon/apple-touch-icon.png"
              alt="apple-touch-icon.png"
              width={96}
              height={96}
              className="object-contain"
            />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2">Asset 4.png</h2>
          <div className="border border-gray-200 p-4 rounded-lg">
            <Image
              src="/Asset 4.png"
              alt="Asset 4.png"
              width={100}
              height={84}
              className="object-contain"
            />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2">Asset 4@2x.png</h2>
          <div className="border border-gray-200 p-4 rounded-lg">
            <Image
              src="/Asset 4@2x.png"
              alt="Asset 4@2x.png"
              width={100}
              height={84}
              className="object-contain"
            />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2">Web manifest 192x192</h2>
          <div className="border border-gray-200 p-4 rounded-lg">
            <Image
              src="/favicon/web-app-manifest-192x192.png"
              alt="web-app-manifest-192x192.png"
              width={96}
              height={96}
              className="object-contain"
            />
          </div>
        </div>
      </div>

      <div className="mt-12 text-center max-w-md">
        <h2 className="text-xl font-bold mb-4">Current Logo in Header</h2>
        <p className="mb-4 text-sm text-gray-600">
          The logo in the header has been updated to use Asset 4@2x.png with
          width 48px and height 40px.
        </p>
        <div className="inline-block border border-gray-200 p-4 rounded-lg bg-gray-50">
          <Image
            src="/Asset 4@2x.png"
            alt="Current Logo"
            width={48}
            height={40}
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
