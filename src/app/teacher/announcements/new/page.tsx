"use client"
// Teacher new announcement - delegates to shared form
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Loader2, ArrowLeft, CheckCircle2, Pin, XCircle } from "lucide-react"

interface Group { id: string; name: string }
const ROLE_OPTIONS = [{ value:"STUDENT",label:"Élèves",icon:"🎓"},{value:"PARENT",label:"Parents",icon:"👨‍👩‍👦"}]
const TYPE_OPTIONS = [
  {value:"GENERAL",label:"Général",cls:"bg-gray-50 border-gray-300",active:"bg-gray-100 border-gray-500"},
  {value:"EVENT",label:"Événement",cls:"bg-blue-50 border-blue-200",active:"bg-blue-100 border-blue-500"},
  {value:"ACHIEVEMENT",label:"Réussite",cls:"bg-yellow-50 border-yellow-200",active:"bg-yellow-100 border-yellow-500"},
  {value:"URGENT",label:"Urgent",cls:"bg-red-50 border-red-200",active:"bg-red-100 border-red-500"},
]
export default function TeacherNewAnnouncementPage() {
  const router = useRouter()
  const [groups,setGroups]=useState<Group[]>([])
  const [selectedRoles,setSelectedRoles]=useState<string[]>(["STUDENT","PARENT"])
  const [selectedGroups,setSelectedGroups]=useState<string[]>([])
  const [selectedType,setSelectedType]=useState("GENERAL")
  const [isPinned,setIsPinned]=useState(false)
  const [title,setTitle]=useState(""); const [titleAr,setTitleAr]=useState("")
  const [content,setContent]=useState(""); const [contentAr,setContentAr]=useState("")
  const [expiresAt,setExpiresAt]=useState("")
  const [loading,setLoading]=useState(false); const [error,setError]=useState<string|null>(null); const [success,setSuccess]=useState(false)
  useEffect(()=>{fetch("/api/groups?mine=true").then(r=>r.json()).then(d=>setGroups(d.groups||[]))},[])
  const toggleRole=(r:string)=>setSelectedRoles(p=>p.includes(r)?p.filter(x=>x!==r):[...p,r])
  const toggleGroup=(id:string)=>setSelectedGroups(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])
  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault()
    if(!title.trim()){setError("Titre requis");return}
    if(!content.trim()){setError("Contenu requis");return}
    if(!selectedRoles.length){setError("Sélectionnez un destinataire");return}
    setLoading(true);setError(null)
    try{
      const body:Record<string,unknown>={title:title.trim(),titleAr:titleAr.trim()||undefined,content:content.trim(),contentAr:contentAr.trim()||undefined,type:selectedType,targetRoles:selectedRoles,targetGroupIds:selectedGroups,isPinned,isPublished:true}
      if(expiresAt)body.expiresAt=new Date(expiresAt).toISOString()
      const r=await fetch("/api/announcements",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
      if(!r.ok)throw new Error((await r.json()).error||"Erreur")
      setSuccess(true); setTimeout(()=>router.push("/teacher/announcements"),2000)
    }catch(err){setError(err instanceof Error?err.message:"Erreur")}finally{setLoading(false)}
  }
  if(success)return(<div className="flex items-center justify-center min-h-[60vh]"><div className="text-center"><CheckCircle2 size={56} className="text-tahfidz-green mx-auto mb-4"/><h2 className="text-xl font-bold">Annonce publiée !</h2></div></div>)
  return(
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={()=>router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition"><ArrowLeft size={18} className="text-gray-500"/></button>
        <div><h1 className="text-2xl font-bold text-gray-900">Nouvelle annonce</h1><p className="text-sm text-gray-500">Pour vos élèves et parents</p></div>
      </div>
      {error&&<div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"><XCircle size={16}/>{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
          <h2 className="font-semibold text-gray-800">Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TYPE_OPTIONS.map(opt=><button key={opt.value} type="button" onClick={()=>setSelectedType(opt.value)} className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition ${selectedType===opt.value?opt.active:opt.cls+" text-gray-600"}`}>{opt.label}</button>)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Contenu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Titre (français) *</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Titre…" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm"/></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Titre (arabe)</label><input value={titleAr} onChange={e=>setTitleAr(e.target.value)} dir="rtl" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm arabic focus:outline-none focus:ring-2 focus:ring-tahfidz-green"/></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Contenu (français) *</label><textarea rows={4} value={content} onChange={e=>setContent(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-tahfidz-green"/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Contenu (arabe)</label><textarea rows={3} value={contentAr} onChange={e=>setContentAr(e.target.value)} dir="rtl" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm resize-none arabic focus:outline-none focus:ring-2 focus:ring-tahfidz-green"/></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Destinataires</h2>
          <div className="flex gap-3">{ROLE_OPTIONS.map(r=><button key={r.value} type="button" onClick={()=>toggleRole(r.value)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm transition ${selectedRoles.includes(r.value)?"border-tahfidz-green bg-tahfidz-green-light text-tahfidz-green font-medium":"border-gray-200 text-gray-500"}`}><span>{r.icon}</span><span>{r.label}</span></button>)}</div>
          {groups.length>0&&<div><p className="text-sm text-gray-600 mb-2">Groupes (optionnel)</p><div className="flex flex-wrap gap-2">{groups.map(g=><button key={g.id} type="button" onClick={()=>toggleGroup(g.id)} className={`px-3 py-1.5 rounded-lg border text-sm transition ${selectedGroups.includes(g.id)?"border-tahfidz-green bg-tahfidz-green-light text-tahfidz-green font-medium":"border-gray-200 text-gray-500"}`}>{g.name}</button>)}</div></div>}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
          <h2 className="font-semibold text-gray-800">Options</h2>
          <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={isPinned} onChange={e=>setIsPinned(e.target.checked)} className="w-4 h-4 accent-tahfidz-green"/><div className="flex items-center gap-2"><Pin size={15} className="text-tahfidz-green"/><span className="text-sm font-medium text-gray-700">Épingler</span></div></label>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Date d&apos;expiration</label><input type="datetime-local" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green"/></div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={()=>router.back()} className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition">Annuler</button>
          <button type="submit" disabled={loading||!selectedRoles.length} className="flex-1 py-3 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2">
            {loading?<><Loader2 size={16} className="animate-spin"/>Publication…</>:"Publier l&apos;annonce"}
          </button>
        </div>
      </form>
    </div>
  )
}
