"use client"

export default function AttendanceFilters({
  selectedGroupId,
  selectedDate,
  groups,
}: {
  selectedGroupId: string
  selectedDate: string
  groups: { id: string; name: string; teacher: { user: { fullName: string } } }[]
}) {
  return (
    <form className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Groupe</label>
          <select
            name="groupId"
            defaultValue={selectedGroupId}
            onChange={(e) => {
              const url = new URL(window.location.href)
              url.searchParams.set("groupId", e.target.value)
              window.location.href = url.toString()
            }}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} — {g.teacher.user.fullName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
          <input
            type="date"
            name="date"
            defaultValue={selectedDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => {
              const url = new URL(window.location.href)
              url.searchParams.set("date", e.target.value)
              window.location.href = url.toString()
            }}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
          />
        </div>
      </div>
    </form>
  )
}