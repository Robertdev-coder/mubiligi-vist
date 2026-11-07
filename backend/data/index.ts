import "server-only";
import * as local from "./local";
import * as remote from "./supabase";
import { isSupabaseEnabled } from "@/backend/supabase/server";

export const backend = isSupabaseEnabled() ? remote : local;
export const backendMode: "supabase" | "local" = isSupabaseEnabled() ? "supabase" : "local";
export { isSupabaseEnabled };
