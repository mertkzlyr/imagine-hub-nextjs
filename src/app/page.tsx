import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Create and Share Your AI Art
        </h1>
        <p className="text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
          Join ImagineHub to create stunning AI-generated art and share your creations with a community of artists and enthusiasts.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/create"
            className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Create Art
          </Link>
          <Link
            href="/gallery"
            className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Browse Gallery
          </Link>
        </div>
      </section>

      {/* Featured Images Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Featured Creations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder for featured images - Replace with actual data from your API */}
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
            >
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                Loading...
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-indigo-600 text-xl font-bold">1</span>
            </div>
            <h3 className="text-lg font-semibold">Create</h3>
            <p className="text-gray-600">
              Use our AI tools to generate unique artwork from your descriptions
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-indigo-600 text-xl font-bold">2</span>
            </div>
            <h3 className="text-lg font-semibold">Share</h3>
            <p className="text-gray-600">
              Upload your creations to the gallery for others to see
            </p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-indigo-600 text-xl font-bold">3</span>
            </div>
            <h3 className="text-lg font-semibold">Connect</h3>
            <p className="text-gray-600">
              Join a community of artists and art enthusiasts
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
