"use client"
// src/app/admin/parents/[id]/message/page.tsx
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send, CheckCircle2, Loader2, Mail } from "lucide-react"
interface Parent { id:string; user:{fullName:string;fullNameAr?:string|null;email:string;phone?:string|null}; childrenLinks:{student:{user:{fullName:string}}}[] }
export default function MessageParentPage({ params }:{ params:{id:string} }) {
  const router=useRouter()
  const [parent,setParent]=useState<Parent|null>(null)
  const [subject,setSubject]=useState(""); const [body,setBody]=useState("")
  const [loading,setLoading]=useState(false); const [success,setSuccess]=useState(false); const [error,setError]=useState<string|null>(null)
  useEffect(()=>{fetch(`/api/parents/${params.id}`).then(r=>r.json()).then(d=>setParent(d.parent))},[params.id])
  const TEMPLATES=[
    {l:"Absence",s:"Absence signalée",b:`Bonjour ${parent?.user.fullName||""},\n\nNous vous informons que votre enfant ${parent?.childrenLinks[0]?.student.user.fullName||""} était absent lors de la dernière session.\n\nCordialement,\nL'équipe TAHFIDZ`},
    {l:"Félicitations",s:"Félicitations !",b:`Bonjour ${parent?.user.fullName||""},\n\nVotre enfant ${parent?.childrenLinks[0]?.student.user.fullName||""} a mémorisé une nouvelle sourate avec succès !\n\nCordialement,\nL'équipe TAHFIDZ`},
    {l:"Rappel session",s:"Rappel : prochaine session",b:`Bonjour ${parent?.user.fullName||""},\n\nCeci est un rappel pour la prochaine session de mémorisation de votre enfant.\n\nCordialement,\nL'équipe TAHFIDZ`},
  ]
  const send=async()=>{
    if(!subject.trim()||!body.trim()){setError("Objet et message requis");return}
    if(!parent)return
    setLoading(true);setError(null)
    try{
      const r=await fetch("/api/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({toUserId:parent.id,subject,body})})
      if(!r.ok)throw new Error((await r.json()).error||"Erreur")
      setSuccess(true)
    }catch(e){setError(e instanceof Error?e.message:"Erreur")}finally{setLoading(false)}
  }
  if(success)return(<div className="flex items-center justify-center min-h-[60vh]"><div className="text-center"><CheckCircle2 size={56} className="text-tahfidz-green mx-auto mb-4"/><h2 className="text-xl font-bold text-gray-800">Message envoyé !</h2><p className="text-gray-500 mt-1">Email + notification envoyés au parent.</p><button onClick={()=>router.back()} className="mt-4 px-5 py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 transition">Retour</button></div></div>)
  return(
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={()=>router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition"><ArrowLeft size={18} className="text-gray-500"/></button>
        <div><h1 className="text-2xl font-bold text-gray-900">Envoyer un message</h1><p className="text-sm text-gray-500">Email + notification dans l'application</p></div>
      </div>
      {parent&&(<div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Destinataire</h2>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center"><span className="text-white font-bold text-lg">{parent.user.fullName.charAt(0)}</span></div>
          <div>
            <p className="font-semibold text-gray-900">{parent.user.fullName}</p>
            {parent.user.fullNameAr&&<p className="arabic text-sm text-gray-400">{parent.user.fullNameAr}</p>}
            <div className="flex items-center gap-2 mt-1"><span className="text-xs text-gray-400 flex items-center gap-1"><Mail size={11}/>{parent.user.email}</span>{parent.user.phone&&<span className="text-xs text-gray-400">📱{parent.user.phone}</span>}</div>
            {parent.childrenLinks.length>0&&<p className="text-xs text-tahfidz-green mt-1">Parent de : {parent.childrenLinks.map(l=>l.student.user.fullName).join(", ")}</p>}
          </div>
        </div>
      </div>)}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Messages rapides</h2>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map(t=><button key={t.l} onClick={()=>{setSubject(t.s);setBody(t.b)}} className="px-3 py-1.5 text-xs border border-tahfidz-green text-tahfidz-green rounded-lg hover:bg-tahfidz-green-light transition font-medium">{t.l}</button>)}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Rédiger</h2>
        {error&&<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Objet *</label><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Objet…" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm"/></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label><textarea rows={8} value={body} onChange={e=>setBody(e.target.value)} placeholder="Votre message…" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-tahfidz-green"/></div>
        <div className="flex gap-3">
          <button onClick={()=>router.back()} className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition">Annuler</button>
          <button onClick={send} disabled={loading||!subject.trim()||!body.trim()} className="flex-1 py-3 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2">
            {loading?<><Loader2 size={16} className="animate-spin"/>Envoi…</>:<><Send size={16}/>Envoyer</>}
          </button>
        </div>
      </div>
    </div>
  )
}
