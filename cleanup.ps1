# Cleanup script for dead files in TAHFIDZ project
Remove-Item -Path 'src/components/admin/TeachersListI18n.tsx' -Force
Remove-Item -Path 'src/components/admin/StatsChartsI18n.tsx' -Force
Remove-Item -Path 'src/components/admin/CertificateTemplateEditorI18n.tsx' -Force
Remove-Item -Path 'src/components/admin/StudentsListClient.tsx' -Force
Remove-Item -Path 'src/app/api/students/[id]/status/route.ts' -Force