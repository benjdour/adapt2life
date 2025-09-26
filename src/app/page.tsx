'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-gray-800">
        <div className="flex items-center">
          <Image src="/logo.png" alt="Adapt2Life Logo" width={40} height={40} className="mr-2" />
          <span className="text-xl font-bold">Adapt2Life</span>
        </div>
        
        {/* Bouton Hamburger pour mobile */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-white focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
          </svg>
        </button>

        {/* Menu de navigation pour desktop */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="#" className="hover:text-green-400">Home</Link>
          <Link href="#" className="hover:text-green-400">Features</Link>
          <Link href="#" className="hover:text-green-400">How It Works</Link>
          <Link href="#" className="hover:text-green-400">Contact</Link>
          <Link href="#" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-md hover:from-blue-600 hover:to-green-600">
            Sign Up
          </Link>
        </nav>
      </header>
      
      {/* Menu mobile qui apparaît quand le bouton est cliqué */}
      {isMenuOpen && (
        <nav className="md:hidden flex flex-col items-center w-full p-4 bg-gray-800 space-y-4">
          <Link href="#" className="hover:text-green-400">Home</Link>
          <Link href="#" className="hover:text-green-400">Features</Link>
          <Link href="#" className="hover:text-green-400">How It Works</Link>
          <Link href="#" className="hover:text-green-400">Contact</Link>
          <Link href="#" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-md hover:from-blue-600 hover:to-green-600">
            Sign Up
          </Link>
        </nav>
      )}

      {/* Hero Section */}
      <main className="flex flex-grow items-center justify-center p-8 bg-gradient-to-br from-blue-700 to-green-700">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 flex justify-center p-4">
            <Image
              src="/main-visual.jpeg"
              alt="Woman exercising"
              width={600}
              height={400}
              className="rounded-lg shadow-lg"
            />
          </div>
          <div className="md:w-1/2 p-4 text-center md:text-left">
            <h1 className="text-5xl font-extrabold mb-4 leading-tight">
              Your AI Trainer <br className="hidden md:block"/> That Adapts To Your Life.
            </h1>
            <p className="text-xl text-gray-200 mb-8">
              Personalized workouts, designed in real-time based on your fitness, goals, and daily constraints.
            </p>
            <Link href="#" className="px-8 py-4 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600 transition duration-300">
              Discover Your Potential
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 p-8 text-gray-400 flex flex-col md:flex-row justify-between items-center md:items-start">
        <div className="mb-6 md:mb-0 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start mb-2">
            <Image src="/logo.png" alt="Adapt2Life Logo" width={30} height={30} className="mr-2" />
            <span className="text-lg font-bold text-white">Adapt2Life</span>
          </div>
          <p className="text-sm">Your AI trainer for a balanced life.</p>
        </div>

        <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-12 text-center md:text-left">
          <div>
            <h3 className="font-semibold text-white mb-2">Navigation</h3>
            <ul>
              <li><Link href="#" className="hover:text-green-400">Home</Link></li>
              <li><Link href="#" className="hover:text-green-400">Features</Link></li>
              <li><Link href="#" className="hover:text-green-400">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">Legal Info</h3>
            <ul>
              <li><Link href="/legal-notice" className="hover:text-green-400">Legal Notice</Link></li>
              <li><Link href="/terms-of-use" className="hover:text-green-400">Terms of Use</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-green-400">Privacy Policy</Link></li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h3 className="font-semibold text-white mb-2">Follow Us</h3>
            <div className="flex space-x-4 justify-center md:justify-start">
              <Link href="#" className="hover:text-green-400"><i className="fab fa-instagram"></i></Link>
              <Link href="#" className="hover:text-green-400"><i className="fab fa-twitter"></i></Link>
              <Link href="#" className="hover:text-green-400"><i className="fab fa-linkedin"></i></Link>
            </div>
          </div>
        </div>

        <div className="mt-8 md:mt-0 text-center md:text-right w-full md:w-auto">
          <p className="text-sm">&copy; 2025 Adapt2Life. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}