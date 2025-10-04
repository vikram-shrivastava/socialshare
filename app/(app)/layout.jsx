"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { Sparkles, Clapperboard } from "lucide-react";

import {
  LogOutIcon,
  MenuIcon,
  LayoutDashboardIcon,
  Share2Icon,
  UploadIcon,
  ImageIcon,
  FilmIcon,
} from "lucide-react";


export default function AppLayout({ children }) {
  const sidebarItems = [
    { href: "/home", icon: LayoutDashboardIcon, label: "My Videos" },
    { href: "/social-share", icon: Share2Icon, label: "Image Resize" },
    { href: "/video-upload", icon: UploadIcon, label: "Upload Video" },
  ];
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleLogoClick = () => router.push("/");

  const handleSignOut = async () => await signOut();

  return (
   <div className="flex bg-base-100 min-h-screen overflow-hidden">
  {/* Sidebar */}
  <aside
    className={`${
      sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    } fixed z-40 w-64 bg-base-200/70 backdrop-blur-md border-r border-base-300 transition-transform duration-300 ease-in-out h-screen flex flex-col`}
  >
    {/* Logo */}
    <div className="flex items-center justify-center py-6 border-b border-base-300 flex-shrink-0">
      <Link
        href="/"
        onClick={handleLogoClick}
        className="flex items-center gap-2 text-xl font-bold"
      >
        <Sparkles className="w-6 h-6" />
        <Clapperboard className="w-6 h-6" />
        <span className="font-semibold">ChainPost</span>
      </Link>
    </div>

    {/* Nav Links */}
    <ul className="flex-1 menu p-4 text-base-content overflow-y-auto">
      {sidebarItems.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 ${
              pathname === item.href
                ? "bg-primary text-primary-content shadow-md p-1.5 mt-2 mb-2"
                : "hover:bg-base-300"
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        </li>
      ))}
    </ul>

    {/* Sign Out */}
    {user && (
      <div className="p-4 border-t border-base-300 flex-shrink-0">
        <button
          onClick={handleSignOut}
          className="btn btn-error btn-outline w-full flex items-center justify-center gap-2"
        >
          <LogOutIcon className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    )}
  </aside>

  {/* Main Content Area */}
  <div className="flex-1 flex flex-col lg:ml-64">
    {/* Top Navbar */}
    <header className="fixed top-0 left-0 right-0 z-30 bg-base-100/70 backdrop-blur-md border-b border-base-300 shadow-sm flex-shrink-0 lg:ml-64">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden btn btn-ghost btn-square"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold text-primary">
            {pathname === "/home"
              ? "My Videos"
              : pathname === "/social-share"
              ? "Image Resize"
              : pathname === "/video-upload"
              ? "Upload Video"
              : pathname.startsWith("/generate/")
              ? "AI Video"
              : pathname.replace("/", "").replace("-", " ")}
          </span>
        </div>

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="w-8 h-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img
                  src={user.imageUrl}
                  alt={user.username || user.emailAddresses[0].emailAddress}
                />
              </div>
            </div>
            <span className="hidden sm:inline text-sm font-medium truncate max-w-[150px]">
              {user.username || user.emailAddresses[0].emailAddress}
            </span>
          </div>
        )}
      </div>
    </header>

    {/* Page Content */}
    <main className="flex-1 overflow-y-auto p-6 pt-[72px]">
      {children}
    </main>
  </div>
</div>
  );
}
