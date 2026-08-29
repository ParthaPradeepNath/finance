"use client";

import { usePathname, useRouter } from "next/navigation";
import { NavButton } from "./nav-button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useMedia } from "react-use";
import { use, useState } from "react";
import { Button } from "./ui/button";
import { Menu } from "lucide-react";

const routes = [
  {
    href: "/",
    label: "Overview",
  },
  {
    href: "/transactions",
    label: "Transactions",
  },
  {
    href: "/accounts",
    label: "Accounts",
  },
  {
    href: "/categories",
    label: "Categories",
  },
  {
    href: "/settings",
    label: "Settings",
  },
];

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMedia("(max-width: 1024px)", false);

  const onClick = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            aria-label="Open navigation menu"
            variant="outline"
            size="sm"
            className="font-normal bg-white/10 hover:bg-white/20 hover:text-white border-none focus-visible:ring-offset-0 focus-visible:ring-transparent outline-none text-white focus:bg-white/30 transition"
          >
            <Menu className="size-4" aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="px-2" aria-label="Navigation menu">
          <nav className="flex flex-col gap-y-2 pt-6" aria-label="Primary">
            {routes.map((route) => (
              <Button
                key={route.href}
                aria-label={route.label}
                aria-current={route.href === pathname ? "page" : undefined}
                variant={route.href === pathname ? "secondary" : "ghost"}
                onClick={() => onClick(route.href)}
                className="w-full justify-start"
              >
                {route.label}
              </Button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <nav className="hiden lg:flex items-center gap-x-2 overflow-x-auto" aria-label="Primary">
      {routes.map((route) => (
        <NavButton
          key={route.href}
          href={route.href}
          label={route.label}
          isActive={pathname === route.href}
        />
      ))}
    </nav>
  );
};
