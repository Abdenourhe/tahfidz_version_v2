"use client"
// src/app/teacher/evaluation/new/page.tsx

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle2, Star, Users, User, Calendar, ArrowLeft } from "lucide-react"
import { calculateFinalScore } from "@/lib/utils"
import { useLanguage, useT } from "@/contexts/LanguageContext"

interface Student { id: string; user: { fullName: string }; group: { name: string } | null }
interface Group   { id: string; name: string; students: { id: string; user: { fullName: string } }[] }
interface Progress { id: string; surahId: number; surah: { nameFr: string; nameAr: string }; status: string; completionPercentage: number }
type Mode = "select" | "student" | "group" | "exam"

function Slider({ label, desc, value, onChange }: { label:string; desc?:string; value:number; onChange:(v:number)=>void }) {
  const g = value>=90?{t:"Excellent",c:"text-green-500"}:value>=75?{t:"Bien",c:"text-blue-500"}:value>=60?{t:"Moyen",c:"text-yellow-500"}:value>=40?{t:"Insuffisant",c:"text-orange-500"}:{t:"Faible",c:"text-red-500"}
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end">
        <div><p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>{desc&&<p className="text-xs text-gray-400">{desc}</p>}</div>
        <div className="text-right"><span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</span><span className="text-sm text-gray-400">/100</span><span className={`ml-2 text-xs ${g.c}`}>— {g.t}</span></div>
      </div>
      <input type="range" min={0} max={100} step={5} value={value} onChange={e=>onChange(Number(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-tahfidz-green" />
      <div className="flex justify-between text-xs text-gray-300"><span>0</span><span>50</span><span>100</span></div>
    </div>
  )
}

export default function NewEvaluationPage() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const router=useRouter(); const sp=useSearchParams() ?? new URLSearchParams()

    const t = useT("evaluation_new")

  const initSid=sp.get("studentId")||""; const initPid=sp.get("progressId")||""; const editId=sp.get("edit")||""
  const [mode,setMode]=useState<Mode>(initSid?"student":"select")
  const [groups,setGroups]=useState<Group[]>([]); const [students,setStudents]=useState<Student[]>([])
  const [sid,setSid]=useState(initSid); const [progs,setProgs]=useState<Progress[]>([]); const [pid,setPid]=useState(initPid)
  const [et,setEt]=useState<"live"|"recorded"|"test">("live")
  const [memo,setMemo]=useState(75); const [taj,setTaj]=useState(75); const [flu,setFlu]=useState(75); const [mak,setMak]=useState(75)
  const [notes,setNotes]=useState(""); const [dec,setDec]=useState<"APPROVED"|"NEEDS_REVISION"|"REJECTED">("APPROVED")
  const [grp,setGrp]=useState(""); const [gscores,_setGscores]=useState<Record<string,{memo:number;taj:number;dec:string}>>({})
  const [eTitle,_setETitle]=useState(""); const [eTitleAr,_setETitleAr]=useState(""); const [eDesc,_setEDesc]=useState("")
  const [eGrp,setEGrp]=useState(""); const [eDate,_setEDate]=useState(""); const [eDur,_setEDur]=useState(60)
  const [sub,setSub]=useState(false); const [ok,setOk]=useState(false); const [err,setErr]=useState<string|null>(null)
  const [editLoading,setEditLoading]=useState(false)

  useEffect(()=>{
    Promise.all([fetch("/api/groups?mine=true").then(r=>r.json()),fetch("/api/students").then(r=>r.json())])
      .then(([gd,sd])=>{setGroups(gd.groups||[]);setStudents(sd.students||[]);if(gd.groups?.[0]){setGrp(gd.groups[0].id);setEGrp(gd.groups[0].id)}})
  },[])

  useEffect(()=>{
    if(!sid)return
    fetch(`/api/progress?studentId=${sid}`).then(r=>r.json()).then(d=>{
      const p=(d.progress||[]).filter((x:Progress)=>["IN_PROGRESS","UNDER_REVIEW","READY_FOR_RECITATION","PENDING_TEACHER_APPROVAL"].includes(x.status))
      setProgs(p); setPid(prev => prev || p[0]?.id || "")
    })
  },[sid])

  // Load existing evaluation for edit mode
  useEffect(()=>{
    if(!editId)return
    setEditLoading(true)
    fetch(`/api/evaluations/${editId}`).then(r=>r.json()).then(d=>{
      const ev=d.evaluation
      if(ev){
        setSid(ev.studentId)
        setPid(ev.progressId)
        setMemo(ev.memorizationScore??ev.tarteel??75)
        setTaj(ev.tajweedScore??ev.tajwid??75)
        setFlu(ev.fluencyScore??ev.waqf??75)
        setMak(ev.makharijScore??ev.makhraj??75)
        setNotes(ev.teacherNotes||"")
        setDec(ev.decision||"APPROVED")
        setEt(ev.evaluationType||"live")
        setMode("student")
      }
    }).finally(()=>setEditLoading(false))
  },[editId])

  const fs=calculateFinalScore({memorizationScore:memo,tajweedScore:taj,fluencyScore:flu,makharijScore:mak})

  const doStudent=async()=>{
    if(!sid||!pid){setErr(t("errorSelect"));return}
    setSub(true);setErr(null)
    try{
      const body={progressId:pid,studentId:sid,evaluationType:et,memorizationScore:memo,tajweedScore:taj,fluencyScore:flu,makharijScore:mak,teacherNotes:notes,revisionRequired:dec!=="APPROVED",decision:dec,strengths:[],improvements:[]}
      const url=editId?`/api/evaluations/${editId}`:"/api/evaluations"
      const method=editId?"PATCH":"POST"
      const r=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
      if(!r.ok)throw new Error((await r.json()).error||t("error"))
      setOk(true);setTimeout(()=>router.push("/teacher/evaluations"),2000)
    }catch(e){setErr(e instanceof Error?e.message:t("error"))}finally{setSub(false)}
  }

  const _doGroup=async()=>{
    const g=groups.find(x=>x.id===grp); if(!g||!Object.keys(gscores).length){setErr(t("errorGrade"));return}
    setSub(true);setErr(null)
    let good=0,skip=0
    for(const st of g.students){
      const sc=gscores[st.id];if(!sc){skip++;continue}
      const pd=await fetch(`/api/progress?studentId=${st.id}`).then(r=>r.json())
      const pp=(pd.progress||[]).find((x:Progress)=>["READY_FOR_RECITATION","PENDING_TEACHER_APPROVAL","IN_PROGRESS","UNDER_REVIEW"].includes(x.status))
      if(!pp){skip++;continue}
      const xfs=Math.round(sc.memo*0.5+sc.taj*0.5)
      const r=await fetch("/api/evaluations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({progressId:pp.id,studentId:st.id,evaluationType:"live",memorizationScore:sc.memo,tajweedScore:sc.taj,fluencyScore:xfs,makharijScore:xfs,revisionRequired:sc.dec!=="APPROVED",decision:sc.dec,strengths:[],improvements:[]})})
      if(r.ok) good++; else skip++
    }
    setOk(true); if(skip)setErr(`${good} ${L === "ar" ? "مُقيَّم" : L === "en" ? "evaluated" : "évalués"}, ${skip} ${L === "ar" ? "متجاهل" : L === "en" ? "skipped" : "ignorés"}`)
    setTimeout(()=>router.push("/teacher/evaluations"),2500); setSub(false)
  }

  const _doExam=async()=>{
    if(!eTitle.trim()||!eGrp||!eDate){setErr(t("errorExam"));return}
    setSub(true);setErr(null)
    try{
      const r=await fetch("/api/exams",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:eTitle,titleAr:eTitleAr||undefined,description:eDesc||undefined,groupId:eGrp,examDate:new Date(eDate).toISOString(),duration:eDur})})
      if(!r.ok)throw new Error((await r.json()).error||t("error"))
      setOk(true);setTimeout(()=>router.push("/teacher/evaluations"),2000)
    }catch(e){setErr(e instanceof Error?e.message:t("error"))}finally{setSub(false)}
  }

  if(ok)return(<div className="flex items-center justify-center min-h-[60vh]"><div className="text-center"><CheckCircle2 size={56} className="text-tahfidz-green mx-auto mb-4"/><h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{mode==="exam"?t("examSaved"):t("saved")}</h2>{err&&<p className="text-sm text-yellow-600 mt-2">{err}</p>}<p className="text-gray-500 mt-1">{t("redirecting")}</p></div></div>)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={()=>mode==="select"?router.back():setMode("select")} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"><ArrowLeft size={18} className="text-gray-500"/></button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{editId?t("titleEdit"):mode==="select"?t("titleSelect"):mode==="student"?t("titleStudent"):mode==="group"?t("titleGroup"):t("titleExam")}</h1>
        {editLoading&&<Loader2 size={18} className="animate-spin text-gray-400"/>}
      </div>

      {err&&<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">{err}</div>}

      {mode==="select"&&(
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{id:"student",icon:User,title:t("byStudent"),desc:t("byStudentDesc"),color:"border-tahfidz-green hover:bg-tahfidz-green-light"},{id:"group",icon:Users,title:t("byGroup"),desc:t("byGroupDesc"),color:"border-blue-400 hover:bg-blue-50"},{id:"exam",icon:Calendar,title:t("scheduleExam"),desc:t("scheduleDesc"),color:"border-purple-400 hover:bg-purple-50"}].map(o=>(
            <button key={o.id} onClick={()=>setMode(o.id as Mode)} className={`p-6 rounded-2xl border-2 text-left transition hover:shadow-md ${o.color}`}>
              <o.icon size={28} className="mb-3 text-gray-600 dark:text-gray-400"/><p className="font-bold text-gray-800 dark:text-gray-200 mb-1">{o.title}</p><p className="text-sm text-gray-500">{o.desc}</p>
            </button>
          ))}
        </div>
      )}

      {mode==="student"&&(
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("studentSurah")}</h2>
            <select value={sid} onChange={e=>{setSid(e.target.value);setPid("")}} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
              <option value="">{t("selectStudent")}</option>
              {students.map(s=><option key={s.id} value={s.id}>{s.user.fullName}{s.group?` · ${s.group.name}`:""}</option>)}
            </select>
            {sid&&progs.length>0&&<select value={pid} onChange={e=>setPid(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
              {progs.map(p=><option key={p.id} value={p.id}>{p.surah.nameFr} — {p.surah.nameAr} ({Math.round(p.completionPercentage)}%)</option>)}
            </select>}
            {sid&&progs.length===0&&<div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-orange-700 dark:text-orange-300 text-sm">⚠️ {t("noActive")}</div>}
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">{t("type")}</h2>
            <div className="grid grid-cols-3 gap-3">
              {[{v:"live",l:t("live")},{v:"recorded",l:t("recorded")},{v:"test",l:t("test")}].map(t_=>(
                <button key={t_.v} type="button" onClick={()=>setEt(t_.v as any)} className={`p-3 rounded-xl border-2 text-sm font-medium transition ${et===t_.v?"border-tahfidz-green bg-tahfidz-green-light dark:bg-emerald-900/20 text-tahfidz-green":"border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>{t_.l}</button>
              ))}
            </div>
          </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("criteria")}</h2>
          <Slider label={t("memorization")} desc={t("memorizationDesc")} value={memo} onChange={setMemo}/>
          <Slider label={t("tajweed")} desc={t("tajweedDesc")} value={taj} onChange={setTaj}/>
          <Slider label={t("fluency")} desc={t("fluencyDesc")} value={flu} onChange={setFlu}/>
          <Slider label={t("makharij")} desc={t("makharijDesc")} value={mak} onChange={setMak}/>
        </div>
        <div className={`rounded-xl p-5 text-center border-2 ${fs>=75?"border-green-300 bg-green-50 dark:bg-green-900/20":fs>=50?"border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20":"border-red-300 bg-red-50 dark:bg-red-900/20"}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t("finalScore")}</p>
          <p className={`text-5xl font-bold ${fs>=75?"text-green-600 dark:text-green-400":fs>=50?"text-yellow-600 dark:text-yellow-400":"text-red-500 dark:text-red-400"}`}>{fs}</p>
          <p className="text-xs text-gray-400 mt-1">{t("scoreFormula")}</p>
          <div className="flex justify-center gap-1 mt-2">{[...Array(5)].map((_,i)=><Star key={i} size={18} className={i < Math.round(fs/20)?"text-yellow-400 fill-yellow-400":"text-gray-200 dark:text-gray-700 fill-gray-200 dark:fill-gray-700"}/>)}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("teacherNotes")}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("decision")}</label>
            <div className="flex gap-2 flex-wrap">
              {(["APPROVED","NEEDS_REVISION","REJECTED"] as const).map(d => (
                <button key={d} type="button" onClick={() => setDec(d)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg border-2 transition ${dec === d ? (d === "APPROVED" ? "bg-green-500 text-white border-green-500" : d === "NEEDS_REVISION" ? "bg-yellow-500 text-white border-yellow-500" : "bg-red-500 text-white border-red-500") : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                  {d === "APPROVED" ? t("approved") : d === "NEEDS_REVISION" ? t("revision") : t("rejected")}
                </button>
              ))}
            </div>
          </div>
          <button onClick={doStudent} disabled={sub}
            className="w-full py-3 bg-tahfidz-green text-white font-semibold rounded-xl hover:bg-tahfidz-green-dark transition disabled:opacity-50 flex items-center justify-center gap-2">
            {sub ? <><Loader2 size={16} className="animate-spin" />{t("saving")}</> : t("save")}
          </button>
        </div>
      </div>
      )}
    </div>
  )
}
