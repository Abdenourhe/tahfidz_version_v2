"use client"
// src/app/display/page.tsx — TV Leaderboard
import { useState, useEffect, useCallback } from "react"
interface Student { id:string; rank:number; user:{fullName:string;fullNameAr?:string|null}; group:{name:string}|null; totalStars:number; currentStreak:number; memorizedCount:number; badges:{icon:string;rarity:string}[] }
interface Group   { id:string; name:string; nameAr?:string|null; memorizedTotal:number; avgStars:number; studentCount:number }
interface Data    { topStudents:Student[]; groupStats:Group[]; totalMemorized:number; totalStudents:number; lastUpdated:string }
const MEDAL: Record<number,{bg:string;t:string;l:string}> = {1:{bg:"bg-yellow-400",t:"text-yellow-900",l:"🥇"},2:{bg:"bg-gray-300",t:"text-gray-700",l:"🥈"},3:{bg:"bg-orange-400",t:"text-orange-900",l:"🥉"}}
export default function DisplayPage() {
  const [data,setData]=useState<Data|null>(null); const [slide,setSlide]=useState<"top"|"groups"|"verse">("top"); const [dark,setDark]=useState(true); const [loading,setLoading]=useState(true)
  const fetch_=useCallback(async()=>{
    try {
      const hostname = typeof window !== "undefined" ? window.location.hostname : ""
      const schoolSlug = hostname.includes(".") ? hostname.split(".")[0] : hostname
      const r = await fetch(`/api/display?schoolSlug=${encodeURIComponent(schoolSlug)}`)
      const d = await r.json()
      setData(d)
    } catch {} finally { setLoading(false) }
  },[])
  useEffect(()=>{fetch_();const id=setInterval(fetch_,60000);return()=>clearInterval(id)},[fetch_])
  useEffect(()=>{const slides:("top"|"groups"|"verse")[]=(["top","groups","verse"]);let i=0;const id=setInterval(()=>{i=(i+1)%slides.length;setSlide(slides[i])},12000);return()=>clearInterval(id)},[])
  const bg=dark?"bg-gray-950":"bg-gradient-to-br from-green-50 to-white"; const txt=dark?"text-white":"text-gray-900"; const card=dark?"bg-gray-900 border-gray-800":"bg-white border-gray-200"
  if(loading)return(<div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="text-white text-center"><div className="w-16 h-16 border-4 border-tahfidz-green border-t-transparent rounded-full animate-spin mx-auto mb-4"/><p className="text-xl">Chargement…</p></div></div>)
  return(
    <div className={`min-h-screen ${bg} p-6 transition-all duration-700`}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-tahfidz flex items-center justify-center"><span className="text-white font-bold text-xl">TH</span></div>
          <div><h1 className={`text-3xl font-bold ${txt}`}>TAHFIDZ</h1><p className="arabic text-tahfidz-green text-xl">تحفيظ القرآن الكريم</p></div>
        </div>
        <div className="flex gap-4">
          {[{l:"Élèves",v:data?.totalStudents??0},{l:"Mémorisées",v:data?.totalMemorized??0}].map(s=>(
            <div key={s.l} className={`${card} border rounded-xl px-5 py-3 text-center`}><p className="text-3xl font-bold text-tahfidz-green">{s.v}</p><p className={`text-sm ${dark?"text-gray-400":"text-gray-500"}`}>{s.l}</p></div>
          ))}
          <button onClick={()=>setDark(!dark)} className={`px-3 py-2 rounded-lg text-xs ${card} border ${txt}`}>{dark?"☀️":"🌙"}</button>
          <button onClick={()=>fetch_()} className="px-3 py-2 rounded-lg text-xs bg-tahfidz-green text-white">🔄</button>
        </div>
      </div>
      <div className="flex justify-center gap-2 mb-6">
        {(["top","groups","verse"] as const).map(s=>(
          <button key={s} onClick={()=>setSlide(s)} className={`h-2 rounded-full transition-all ${slide===s?"bg-tahfidz-green w-12":"w-8 "+(dark?"bg-gray-700":"bg-gray-300")}`}/>
        ))}
      </div>
      {slide==="top"&&data&&(<div className="animate-fade-in">
        <h2 className={`text-2xl font-bold ${txt} text-center mb-6`}>🏆 Classement des champions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {data.topStudents.slice(0,9).map(s=>{const m=MEDAL[s.rank];return(
            <div key={s.id} className={`${card} border rounded-2xl p-5 flex items-center gap-4 ${s.rank<=3?"ring-2 ring-yellow-400/50":""}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${m?`${m.bg} ${m.t}`:dark?"bg-gray-800 text-gray-400":"bg-gray-100 text-gray-600"}`}>{m?m.l:`#${s.rank}`}</div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold truncate ${txt}`}>{s.user.fullName}</p>
                {s.user.fullNameAr&&<p className="arabic text-sm text-tahfidz-green">{s.user.fullNameAr}</p>}
                <p className={`text-xs ${dark?"text-gray-400":"text-gray-500"}`}>{s.group?.name??""}</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs text-tahfidz-gold font-bold">⭐{s.totalStars}</span>
                  <span className={`text-xs ${dark?"text-gray-400":"text-gray-500"}`}>📖{s.memorizedCount}</span>
                  {s.currentStreak>0&&<span className="text-xs text-orange-400">🔥{s.currentStreak}j</span>}
                </div>
                <div className="flex gap-1 mt-1">{s.badges.slice(0,4).map((b,i)=><span key={i} className="text-base">{b.icon}</span>)}</div>
              </div>
            </div>
          )})}
        </div>
      </div>)}
      {slide==="groups"&&data&&(<div className="animate-fade-in max-w-4xl mx-auto">
        <h2 className={`text-2xl font-bold ${txt} text-center mb-6`}>📚 Classement des groupes</h2>
        <div className="space-y-4">
          {data.groupStats.map((g,i)=>(
            <div key={g.id} className={`${card} border rounded-2xl p-5 flex items-center gap-5`}>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold flex-shrink-0 ${i===0?"bg-yellow-400 text-yellow-900":i===1?"bg-gray-300 text-gray-700":i===2?"bg-orange-400 text-orange-900":dark?"bg-gray-800 text-gray-400":"bg-gray-100 text-gray-600"}`}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</div>
              <div className="flex-1"><p className={`text-xl font-bold ${txt}`}>{g.name}</p></div>
              <div className="flex gap-6 text-center">
                <div><p className="text-2xl font-bold text-tahfidz-green">{g.memorizedTotal}</p><p className={`text-xs ${dark?"text-gray-400":"text-gray-500"}`}>Mémorisées</p></div>
                <div><p className="text-2xl font-bold text-tahfidz-gold">⭐{g.avgStars}</p><p className={`text-xs ${dark?"text-gray-400":"text-gray-500"}`}>Moy.</p></div>
                <div><p className="text-2xl font-bold text-blue-400">{g.studentCount}</p><p className={`text-xs ${dark?"text-gray-400":"text-gray-500"}`}>Élèves</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>)}
      {slide==="verse"&&(<div className="animate-fade-in flex items-center justify-center min-h-[50vh]">
        <div className={`${card} border rounded-3xl p-12 max-w-3xl mx-auto text-center`}>
          <p className="arabic text-4xl text-tahfidz-green leading-loose mb-6">إِنَّ الَّذِينَ يَتْلُونَ كِتَابَ اللَّهِ وَأَقَامُوا الصَّلَاةَ</p>
          <p className={`text-lg ${dark?"text-gray-300":"text-gray-600"} mb-2`}>« Ceux qui récitent le Livre d&apos;Allah et accomplissent la Salat… »</p>
          <p className={`text-sm ${dark?"text-gray-500":"text-gray-400"}`}>Sourate Fatir 35:29</p>
          <div className="mt-8 text-6xl">📖</div>
        </div>
      </div>)}
      <div className="mt-8 text-center"><p className={`text-sm ${dark?"text-gray-600":"text-gray-400"}`}>TAHFIDZ · {new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</p></div>
    </div>
  )
}
