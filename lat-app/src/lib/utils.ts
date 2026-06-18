import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`
}

export function getScoreColor(score: number): string {
  if (score >= 0.8) return "text-green-600"
  if (score >= 0.6) return "text-amber-600"
  if (score >= 0.4) return "text-orange-600"
  return "text-red-600"
}

export function getScoreBgColor(score: number): string {
  if (score >= 0.8) return "bg-green-500"
  if (score >= 0.6) return "bg-amber-500"
  if (score >= 0.4) return "bg-orange-500"
  return "bg-red-500"
}
