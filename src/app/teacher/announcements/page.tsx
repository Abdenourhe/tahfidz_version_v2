"use client"
// src/app/teacher/announcements/page.tsx — FIXED: loads correctly, edit + delete

import { useState, useEffect } from "react"
import Link from "next/link"
import { Megaphone, Plus, Pencil, Trash2, Loader2, Pin } from "lucide-react"

interface Ann {
  id:string; title:string; titleAr?:string|null; type:string; content:string
  isPinned:boolean; isPublished:boolean; createdAt:string; expiresAt?:string|null
  targetRoles:string[]; author:{fullName:string}; targetGroups:{group:{name:string}}[]
}

const TC: Record<string,{label:string;color:string}> = {
  GENERAL:     {label:"Général",   color:"bg-gray-100 text-gray-600"},
  EVENT:       {label:"Événement", color:"bg-blue-100 text-blue-700"},
  ACHIEVEMENT: {label:"Réussite",  color:"bg-yellow-100 text-yellow-700"},
  URGENT:      {label:"Urgent",    color:"bg-red-100 text-red-700"},
}

function fmtDate(d:string){return new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"})}

export default function TeacherAnnouncementsPage() {
  const [anns,setAnns]=useState<Ann[]>([])
  const [loading,setLoading]=useState(true)
  const [confirmId,setConfirmId]=useState<string|null>(null)
  const [deleting,setDeleting]=useState<string|null>(null)

  const load=async()=>{
    setLoading(true)
    try{
      // Load ALL announcements visible to this teacher
      const r=await fetch("/api/announcements?limit=100")
      const d=await r.json()
      setAnns(d.announcements||[])
    }finally{setLoading(false)}
  }

  useEffect(()=>{load()},[])

  const del=async(id:string)=>{
    setDeleting(id); setConfirmId(null)
    try{
      await fetch(`/api/announcements/${id}`,{method:"DELETE"})
      setAnns(p=>p.filter(a=>a.id!==id))
    }finally{setDeleting(null)}
  }

  return(
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Annonces</h1>
          <p className="text-sm text-gray-500 mt-1">Toutes les annonces publiées</p>
        </div>
        <Link href="/teacher/announcements/new"
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 gradient-tahfidz text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
          <Plus size={16}/>
          <span className="sm:hidden">Nouvelle</span>
          <span className="hidden sm:inline">Nouvelle annonce</span>
        </Link>
      </div>

      {loading?(
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-tahfidz-green"/></div>
      ):anns.length===0?(
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Megaphone size={32} className="mx-auto mb-2 text-gray-300"/>
          <p className="text-gray-400 mb-3">Aucune annonce</p>
          <Link href="/teacher/announcements/new" className="text-sm text-tahfidz-green hover:underline font-medium">Créer une annonce →</Link>
        </div>
      ):(
        <div className="space-y-3">
          {anns.map(ann=>{
            const tc=TC[ann.type]??TC.GENERAL
            const expired=ann.expiresAt&&new Date(ann.expiresAt)<new Date()
            return(
              <div key={ann.id} className={`bg-white rounded-xl border p-4 sm:p-5 ${ann.isPinned?"border-tahfidz-green":"border-gray-100"} ${expired?"opacity-60":""}`}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {ann.isPinned&&<Pin size={15} className="text-tahfidz-green flex-shrink-0"/>}
                      <h3 className="font-semibold text-gray-900">{ann.title}</h3>
                      {ann.titleAr&&<span className="arabic text-sm text-gray-400">{ann.titleAr}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tc.color}`}>{tc.label}</span>
                      {expired&&<span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Expirée</span>}
                      {!ann.isPublished&&<span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">Brouillon</span>}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-1">{ann.content}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span>Par {ann.author.fullName}</span>
                      <span>· {fmtDate(ann.createdAt)}</span>
                      {ann.expiresAt&&<span>· Expire le {fmtDate(ann.expiresAt)}</span>}
                      <span>· {ann.targetRoles.join(", ")}</span>
                      {ann.targetGroups.length>0&&<span>· {ann.targetGroups.map(tg=>tg.group.name).join(", ")}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 sm:mt-0 sm:flex-shrink-0">
                    <Link href={`/admin/announcements/${ann.id}/edit`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition">
                      <Pencil size={12}/>Modifier
                    </Link>
                    {confirmId===ann.id?(
                      <div className="flex gap-1">
                        <button onClick={()=>del(ann.id)} disabled={!!deleting}
                          className="px-2 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60">
                          {deleting===ann.id?<Loader2 size={11} className="animate-spin"/>:"Oui"}
                        </button>
                        <button onClick={()=>setConfirmId(null)} className="px-2 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50">Non</button>
                      </div>
                    ):(
                      <button onClick={()=>setConfirmId(ann.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition">
                        <Trash2 size={12}/>Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
