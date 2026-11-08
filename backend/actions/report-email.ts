"use server";

import nodemailer from "nodemailer";
import { backend } from "@/backend/data";
import { getSessionUser } from "@/backend/auth/session";
import { ATTENDANCE_STATUS_LABEL, REGISTRATION_STATUS_LABEL, RELATIONSHIP_LABEL, TRADE_LABEL } from "@/shared/constants";
import { formatDateKigali, formatTimeKigali, toCsv } from "@/shared/utils";
import { firstZodError, reportEmailSchema, type ActionState } from "@/shared/validation/schemas";

export async function emailAttendanceReportAction(
  _previous: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user || !user.permissions.includes("reports.email")) {
    return { ok: false, message: "You do not have permission to email reports." };
  }

  const parsed = reportEmailSchema.safeParse({
    email: formData.get("email"),
    date: formData.get("date"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: firstZodError(parsed.error),
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
      ),
    };
  }

  const host = process.env.REPORT_SMTP_HOST;
  const port = Number(process.env.REPORT_SMTP_PORT);
  const smtpUser = process.env.REPORT_SMTP_USER;
  const smtpPassword = process.env.REPORT_SMTP_PASSWORD;
  const from = process.env.REPORT_FROM_EMAIL;
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !smtpUser || !smtpPassword || !from) {
    return {
      ok: false,
      message: "Report email is not configured. Ask the administrator to configure the SMTP settings.",
    };
  }

  try {
    const rows = await backend.getReportRows(parsed.data.date);
    if (rows.length === 0) {
      return { ok: false, message: "There are no attendance records for that date." };
    }

    const headers = [
      "No.",
      "Reference",
      "Visitor",
      "Phone",
      "Relationship",
      "Student",
      "Trade",
      "Level",
      "Class",
      "Registration status",
      "Arrival",
      "Departure",
      "Attendance status",
    ];
    const csvRows = rows.map((row, index) => [
      String(index + 1),
      row.reference_code,
      row.visitor.full_name,
      row.visitor.phone,
      RELATIONSHIP_LABEL[row.visitor.relationship],
      row.student.full_name,
      TRADE_LABEL[row.student.trade],
      row.student.level,
      row.student.class_name,
      REGISTRATION_STATUS_LABEL[row.status],
      row.attendance?.arrival_time ? formatTimeKigali(row.attendance.arrival_time) : "",
      row.attendance?.departure_time ? formatTimeKigali(row.attendance.departure_time) : "",
      ATTENDANCE_STATUS_LABEL[row.attendance?.status ?? "expected"],
    ]);
    const dateLabel = formatDateKigali(parsed.data.date, "dd-MM-yyyy");
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: smtpUser, pass: smtpPassword },
    });

    await transporter.sendMail({
      from,
      to: parsed.data.email,
      subject: `MUBILIGI Visit Day attendance report — ${dateLabel}`,
      text: `Attached is the complete attendance register for ${formatDateKigali(
        parsed.data.date,
        "EEEE, dd MMMM yyyy",
      )}. ${rows.length} record(s).`,
      attachments: [
        {
          filename: `mubiligi-visit-attendance-${parsed.data.date}.csv`,
          content: toCsv(headers, csvRows),
          contentType: "text/csv; charset=utf-8",
        },
      ],
    });

    return {
      ok: true,
      message: `The full attendance report was emailed to ${parsed.data.email}.`,
    };
  } catch (error) {
    console.error("Could not email the attendance report.", error);
    return {
      ok: false,
      message: "Could not send the report. Check the recipient and email service configuration.",
    };
  }
}
