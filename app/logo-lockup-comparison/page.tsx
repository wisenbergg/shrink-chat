"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const lockupComparisons = [
  {
    title: "Blue Lockups",
    horizontal: {
      file: "/logo-lockup-horizontal-blue.svg",
      name: "Horizontal Blue",
      description: "Icon beside text - great for headers and horizontal spaces",
    },
    stacked: {
      file: "/stacked-logo-lockup.svg",
      name: "Stacked Blue",
      description: "Icon above text - perfect for square spaces and app icons",
    },
  },
  {
    title: "Gradient Lockups",
    horizontal: {
      file: "/logo-lockup-horizontal-gradient.svg",
      name: "Horizontal Gradient",
      description: "Icon beside gradient text - premium feel for marketing",
    },
    stacked: {
      file: "/logo-lockup-stacked-gradient.svg",
      name: "Stacked Gradient",
      description: "Icon above gradient text - eye-catching for branding",
    },
  },
];

export default function LogoLockupComparison() {
  const [selectedLogo, setSelectedLogo] = useState(
    "/logo-lockup-horizontal-blue.svg"
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header with selected logo */}
      <div className="logo-position logo-container">
        <Image
          src={selectedLogo}
          alt="whenIwas logo"
          width={selectedLogo.includes("stacked") ? 40 : 60}
          height={selectedLogo.includes("stacked") ? 48 : 32}
          priority
          className="object-contain"
        />
      </div>

      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Logo Lockup Comparison</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Your original icon + Apfel Grotezk Fett text
          </p>
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg inline-block">
            Click any logo to preview it in the header position
          </div>
        </div>

        {lockupComparisons.map((comparison, index) => (
          <div key={index} className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">
              {comparison.title}
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Horizontal Lockup */}
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedLogo === comparison.horizontal.file
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : ""
                }`}
                onClick={() => setSelectedLogo(comparison.horizontal.file)}
              >
                <CardHeader>
                  <CardTitle className="text-center text-xl">
                    {comparison.horizontal.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Large preview */}
                  <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg mb-6">
                    <Image
                      src={comparison.horizontal.file}
                      alt={comparison.horizontal.name}
                      width={240}
                      height={64}
                      className="object-contain"
                    />
                  </div>

                  {/* Description */}
                  <p className="text-center text-muted-foreground mb-4">
                    {comparison.horizontal.description}
                  </p>

                  {/* Use cases */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">
                      Best for:
                    </h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Website headers</li>
                      <li>• Email signatures</li>
                      <li>• Business cards</li>
                      <li>• Wide banner ads</li>
                    </ul>
                  </div>

                  {selectedLogo === comparison.horizontal.file && (
                    <div className="mt-4 text-center">
                      <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        Currently Active in Header
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stacked Lockup */}
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedLogo === comparison.stacked.file
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : ""
                }`}
                onClick={() => setSelectedLogo(comparison.stacked.file)}
              >
                <CardHeader>
                  <CardTitle className="text-center text-xl">
                    {comparison.stacked.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Large preview */}
                  <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg mb-6">
                    <Image
                      src={comparison.stacked.file}
                      alt={comparison.stacked.name}
                      width={160}
                      height={96}
                      className="object-contain"
                    />
                  </div>

                  {/* Description */}
                  <p className="text-center text-muted-foreground mb-4">
                    {comparison.stacked.description}
                  </p>

                  {/* Use cases */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Best for:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• App icons</li>
                      <li>• Social media profiles</li>
                      <li>• Square advertisements</li>
                      <li>• Compact branding</li>
                    </ul>
                  </div>

                  {selectedLogo === comparison.stacked.file && (
                    <div className="mt-4 text-center">
                      <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        Currently Active in Header
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ))}

        {/* Implementation Section */}
        <Card className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Ready to Implement?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Choose your preferred lockup style and I&apos;ll implement it
              across your entire application
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  setSelectedLogo("/logo-lockup-horizontal-blue.svg")
                }
                className={
                  selectedLogo === "/logo-lockup-horizontal-blue.svg"
                    ? "ring-2 ring-blue-500"
                    : ""
                }
              >
                Use Horizontal Blue
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedLogo("/stacked-logo-lockup.svg")}
                className={
                  selectedLogo === "/stacked-logo-lockup.svg"
                    ? "ring-2 ring-blue-500"
                    : ""
                }
              >
                Use Stacked Blue
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setSelectedLogo("/logo-lockup-horizontal-gradient.svg")
                }
                className={
                  selectedLogo === "/logo-lockup-horizontal-gradient.svg"
                    ? "ring-2 ring-blue-500"
                    : ""
                }
              >
                Use Horizontal Gradient
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setSelectedLogo("/logo-lockup-stacked-gradient.svg")
                }
                className={
                  selectedLogo === "/logo-lockup-stacked-gradient.svg"
                    ? "ring-2 ring-blue-500"
                    : ""
                }
              >
                Use Stacked Gradient
              </Button>
            </div>
            <div className="mt-6">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Apply This Logo Site-Wide
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Technical Notes */}
        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-4">
            Technical Implementation Notes:
          </h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>
              • All lockups use your original icon with Apfel Grotezk Fett (700
              weight)
            </li>
            <li>• SVG format ensures perfect scaling at any size</li>
            <li>• Consistent spacing and proportions across all variations</li>
            <li>• Optimized for both light and dark backgrounds</li>
            <li>• Ready for immediate implementation across all pages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
