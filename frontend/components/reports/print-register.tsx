import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { PrintButton } from "@/frontend/components/ui/print-button";
import { SCHOOL, TRADE_LABEL, workspaceFor } from "@/shared/constants";
import {
  formatDateKigali,
  formatLongDateKigali,
  formatTimeKigali,
} from "@/shared/utils";
import type { RegistrationRow, Role, VisitDay } from "@/shared/types";

export function PrintRegister({
  role,
  date,
  rows,
  visitDay,
}: {
  role: Role;
  date: string;
  rows: RegistrationRow[];
  visitDay: VisitDay | null;
}) {
  const base = workspaceFor(role);
  const expected = rows.filter((r) => r.status === "pending" || r.status === "confirmed").length;
  const arrived = rows.filter((r) => r.attendance?.arrival_time).length;
  const completed = rows.filter(
    (r) => r.status === "completed" || r.attendance?.status === "departed",
  ).length;
  const noShow = rows.filter((r) => r.attendance?.status === "no_show").length;
  const sorted = [...rows].sort((a, b) => a.visitor.full_name.localeCompare(b.visitor.full_name));

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href={`${base}/reports?date=${date}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft />
            Back to reports
          </Button>
        </Link>
        <PrintButton label="Print register" />
      </div>

      <div className="print-page rounded-2xl border border-line bg-white p-8 shadow-[0_20px_60px_-30px_rgba(7,26,61,0.25)]">
        <header className="border-b-2 border-navy pb-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            Republic of Rwanda · {SCHOOL.district}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy">{SCHOOL.name}</h1>
          <p className="mt-0.5 text-[12px] text-slate-500">{SCHOOL.address}</p>
          <h2 className="mt-3 text-[15px] font-semibold uppercase tracking-[0.14em] text-navy">
            MUBILIGI VISIT DAY — Visitor Attendance Register
          </h2>
          <p className="mt-1 text-[12px] font-medium text-slate-600">
            {visitDay?.title ? `${visitDay.title} · ` : ""}
            {formatLongDateKigali(date)}
          </p>
        </header>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
          <p>
            <span className="font-semibold text-navy">Total registrations:</span> {rows.length}
            <span className="mx-2 text-slate-300">|</span>
            <span className="font-semibold text-navy">Expected:</span> {expected}
            <span className="mx-2 text-slate-300">|</span>
            <span className="font-semibold text-navy">Arrived:</span> {arrived}
            <span className="mx-2 text-slate-300">|</span>
            <span className="font-semibold text-navy">Completed:</span> {completed}
            <span className="mx-2 text-slate-300">|</span>
            <span className="font-semibold text-navy">No-shows:</span> {noShow}
          </p>
          <p>Generated {formatDateKigali(new Date(), "dd MMM yyyy, HH:mm")}</p>
        </div>

        <table className="print-table mt-4 w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-2 py-2 text-left">#</th>
              <th className="border border-slate-300 px-2 py-2 text-left">Reference</th>
              <th className="border border-slate-300 px-2 py-2 text-left">Visitor</th>
              <th className="border border-slate-300 px-2 py-2 text-left">Phone</th>
              <th className="border border-slate-300 px-2 py-2 text-left">Student</th>
              <th className="border border-slate-300 px-2 py-2 text-left">Trade / Level</th>
              <th className="border border-slate-300 px-2 py-2 text-left">Arrival</th>
              <th className="border border-slate-300 px-2 py-2 text-left">Departure</th>
              <th className="border border-slate-300 px-2 py-2 text-left">Signature</th>
              <th className="border border-slate-300 px-2 py-2 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={10} className="border border-slate-300 px-3 py-8 text-center text-slate-500">
                  No registrations recorded for this visit date.
                </td>
              </tr>
            ) : (
              sorted.map((row, index) => (
                <tr key={row.id}>
                  <td className="border border-slate-300 px-2 py-1.5">{index + 1}</td>
                  <td className="border border-slate-300 px-2 py-1.5 font-mono text-[9.5px]">
                    {row.reference_code}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 font-medium">
                    {row.visitor.full_name}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5">{row.visitor.phone}</td>
                  <td className="border border-slate-300 px-2 py-1.5">
                    {row.student.full_name}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5">
                    {TRADE_LABEL[row.student.trade]} · {row.student.level}
                    <br />
                    <span className="text-[9px] text-slate-500">{row.student.class_name}</span>
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5">
                    {row.attendance?.arrival_time ? formatTimeKigali(row.attendance.arrival_time) : ""}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5">
                    {row.attendance?.departure_time ? formatTimeKigali(row.attendance.departure_time) : ""}
                  </td>
                  <td className="border border-slate-300 px-2 py-6" />
                  <td className="border border-slate-300 px-2 py-1.5" />
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="print-signatures mt-10 grid grid-cols-2 gap-10 text-[11px] text-slate-600">
          <div>
            <p className="font-semibold text-navy">Dean of Discipline</p>
            <div className="mt-8 border-t border-slate-400 pt-1">
              Names &amp; signature
            </div>
            <p className="mt-4">Date: ____________________</p>
          </div>
          <div>
            <p className="font-semibold text-navy">Managing Director</p>
            <div className="mt-8 border-t border-slate-400 pt-1">
              Names &amp; signature
            </div>
            <p className="mt-4">Date: ____________________</p>
          </div>
        </div>

        <footer className="mt-8 border-t border-slate-200 pt-3 text-center text-[9px] text-slate-400">
          {SCHOOL.name} · {SCHOOL.project} · {SCHOOL.phone} · {SCHOOL.email} · All times in Africa/Kigali
        </footer>
      </div>
    </div>
  );
}
