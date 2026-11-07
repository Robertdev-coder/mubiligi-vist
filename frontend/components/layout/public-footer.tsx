import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Brand } from "@/frontend/components/ui/brand";
import { SCHOOL } from "@/shared/constants";

export function PublicFooter() {
  return (
    <footer className="no-print border-t border-white/10 bg-navy text-sky-100/70">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <Brand variant="light" />
          <p className="mt-4 max-w-md text-sm leading-relaxed">
            The official visitor registration platform of {SCHOOL.name}. We are committed to a safe,
            organised and welcoming visit experience for every parent and guardian.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-sky-200/50">
            {SCHOOL.district}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Quick links</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/register" className="transition-colors hover:text-white">
                Register your visit
              </Link>
            </li>
            <li>
              <Link href="/check-registration" className="transition-colors hover:text-white">
                Check my registration
              </Link>
            </li>
            <li>
              <Link href="/#visit-day" className="transition-colors hover:text-white">
                Visit-day information
              </Link>
            </li>
            <li>
              <Link href="/login" className="transition-colors hover:text-white">
                Staff login
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Contact the school</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-sky-300/70" />
              <span>{SCHOOL.address}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0 text-sky-300/70" />
              <span>{SCHOOL.phone}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="size-4 shrink-0 text-sky-300/70" />
              <span>{SCHOOL.email}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {SCHOOL.name}. All rights reserved.
          </p>
          <p className="text-sky-200/50">
            MUBILIGI VISIT DAY · {SCHOOL.timezone}
          </p>
        </div>
      </div>
    </footer>
  );
}
