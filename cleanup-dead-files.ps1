# cleanup-dead-files.ps1
# ÉTAPE 1 : Suppression des fichiers morts confirmés (aucun import externe)

$files = @(
    "src/components/admin/TeachersListI18n.tsx",
    "src/components/admin/StatsChartsI18n.tsx",
    "src/components/admin/CertificateTemplateEditorI18n.tsx",
    "src/components/admin/StudentsListClient.tsx",
    "src/app/api/students/[id]/status/route.ts"
)

foreach ($file in $files) {
    $path = Join-Path $PSScriptRoot $file
    if (Test-Path $path) {
        Remove-Item $path -Force
        Write-Host "✅ Supprimé: $file"
    } else {
        Write-Host "⚠️  Introuvable: $file"
    }
}

Write-Host "`n🗑️ Nettoyage ÉTAPE 1 terminé."
