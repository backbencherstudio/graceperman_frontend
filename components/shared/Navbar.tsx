"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavItem() {
  const pathname = usePathname();
  const menus = [
    { name: "Logo Generate", path: "/logo-design" },
    { name: "Image Generate", path: "/image-generate" },
    { name: "Campaign", path: "/campaign" },

  ];

  return (
    <div className="container flex items-center justify-center mx-auto gap-4 w-full">
      {menus.map(({ path, name }) => (
        <Link
          key={path}
          href={path}
          className={`px-6 py-2 rounded-xl transition-all flex items-center gap-2 ${pathname === path
            ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500  text-white shadow-lg"
            : "text-white bg-fuchsia-800 hover:text-white hover:bg-indigo-600 "
            }`}
        >
          {/* <Ic size={18} /> */}
          {name}
        </Link>
      ))}
    </div>
  );
}