// src/lib/bigbluebutton.ts
// Client BigBlueButton API pour TAHFIDZ Maqra'

import { createHash } from "crypto"

const BBB_SERVER = process.env.BBB_SERVER_URL?.replace(/\/$/, "") ?? ""
const BBB_SECRET = process.env.BBB_SECRET ?? ""

function buildChecksum(apiCall: string, queryString: string): string {
  return createHash("sha1").update(`${apiCall}${queryString}${BBB_SECRET}`).digest("hex")
}

async function bbbCall<T = any>(apiCall: string, params: Record<string, string | number | boolean> = {}): Promise<T> {
  if (!BBB_SERVER || !BBB_SECRET) {
    throw new Error("BBB_SERVER_URL ou BBB_SECRET manquant dans les variables d'environnement")
  }

  const query = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) query.append(k, String(v))
  })
  const queryString = query.toString()
  const checksum = buildChecksum(apiCall, queryString)
  const url = `${BBB_SERVER}/api/${apiCall}${queryString ? "?" + queryString + "&" : "?"}checksum=${checksum}`

  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`BBB API error (${res.status}): ${text.slice(0, 500)}`)
  }
  // BBB retourne du XML, on le parse ici
  const text = await res.text()
  return parseXmlResponse(text) as T
}

function parseXmlResponse(xml: string): any {
  // Parser XML simple via DOMParser (disponible dans Node 20+ via undici)
  // Fallback: parsing basique avec regex pour les champs principaux
  const obj: any = {}
  const responseMatch = xml.match(/<response>\s*<returncode>([^<]+)<\/returncode>([\s\S]*)<\/response>/)
  if (!responseMatch) return { raw: xml }
  obj.returncode = responseMatch[1].trim()
  const body = responseMatch[2]

  // Parse les champs simples
  const simpleFields = body.matchAll(/<(\w+)>([^<]*)<\/\w+>/g)
  for (const [, key, value] of simpleFields) {
    obj[key] = value.trim()
  }
  return obj
}

// ─── Types ────────────────────────────────────────────────────────

export interface CreateMeetingParams {
  meetingID: string
  meetingName: string
  attendeePW: string
  moderatorPW: string
  record?: boolean
  autoStartRecording?: boolean
  allowStartStopRecording?: boolean
  muteOnStart?: boolean
  webcamsOnlyForModerator?: boolean
  lockSettingsDisableCam?: boolean
  lockSettingsDisableMic?: boolean
  welcome?: string
  maxParticipants?: number
  duration?: number
}

export interface CreateMeetingResult {
  returncode: string
  meetingID: string
  internalMeetingID: string
  attendeePW: string
  moderatorPW: string
  createTime: string
  createDate: string
}

export interface JoinMeetingParams {
  meetingID: string
  fullName: string
  password: string
  role: "MODERATOR" | "VIEWER" | "ATTENDEE"
  userID?: string
  redirect?: boolean
  guest?: boolean
}

// ─── API ──────────────────────────────────────────────────────────

export async function createMeeting(params: CreateMeetingParams): Promise<CreateMeetingResult> {
  return bbbCall<CreateMeetingResult>("create", {
    name: params.meetingName,
    meetingID: params.meetingID,
    attendeePW: params.attendeePW,
    moderatorPW: params.moderatorPW,
    record: params.record ?? true,
    autoStartRecording: params.autoStartRecording ?? false,
    allowStartStopRecording: params.allowStartStopRecording ?? true,
    muteOnStart: params.muteOnStart ?? true,
    webcamsOnlyForModerator: params.webcamsOnlyForModerator ?? false,
    lockSettingsDisableCam: params.lockSettingsDisableCam ?? false,
    lockSettingsDisableMic: params.lockSettingsDisableMic ?? false,
    welcome: params.welcome ?? "Bienvenue dans la Maqra'",
    maxParticipants: params.maxParticipants ?? 30,
    duration: params.duration ?? 120,
  })
}

export function joinMeetingUrl(params: JoinMeetingParams): string {
  if (!BBB_SERVER || !BBB_SECRET) {
    throw new Error("BBB_SERVER_URL ou BBB_SECRET manquant")
  }

  const query = new URLSearchParams()
  query.append("fullName", params.fullName)
  query.append("meetingID", params.meetingID)
  query.append("password", params.password)
  query.append("redirect", String(params.redirect ?? true))
  if (params.userID) query.append("userID", params.userID)
  if (params.guest) query.append("guest", "true")

  const queryString = query.toString()
  const checksum = buildChecksum("join", queryString)
  return `${BBB_SERVER}/api/join?${queryString}&checksum=${checksum}`
}

export async function endMeeting(meetingID: string, password: string): Promise<void> {
  await bbbCall("end", { meetingID, password })
}

export async function getRecordings(meetingID?: string): Promise<any[]> {
  const params: Record<string, string> = {}
  if (meetingID) params.meetingID = meetingID
  const res = await bbbCall<any>("getRecordings", params)
  if (!res.recordings) return []
  // BBB retourne un seul objet ou un tableau
  const recs = Array.isArray(res.recordings) ? res.recordings : [res.recordings]
  return recs.filter(Boolean)
}

export async function getMeetingInfo(meetingID: string): Promise<any> {
  return bbbCall("getMeetingInfo", { meetingID })
}

export async function isMeetingRunning(meetingID: string): Promise<boolean> {
  const res = await bbbCall<{ running?: string }>("isMeetingRunning", { meetingID })
  return res.running === "true"
}

// ─── Helpers ──────────────────────────────────────────────────────

export function generatePassword(length = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

export function generateMeetingID(teacherId: string): string {
  return `tahfidz-${teacherId}-${Date.now()}`
}

export function isConfigured(): boolean {
  return Boolean(BBB_SERVER && BBB_SECRET)
}
