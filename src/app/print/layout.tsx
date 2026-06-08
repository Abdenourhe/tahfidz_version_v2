export const metadata = {
  title: "Impression",
}

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white text-black m-0 p-0 min-h-screen">
      {children}
    </div>
  )
}
