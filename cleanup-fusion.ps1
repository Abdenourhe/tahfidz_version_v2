# cleanup-fusion.ps1
# Supprime les anciens fichiers après fusion

$files = @(
    "src/components/admin/StudentTableClient.tsx",
    "src/components/admin/StudentActions.tsx",
    "src/components/admin/StudentDetailClient.tsx",
    "src/components/admin/StudentGroupTransfer.tsx",
    "src/components/admin/TransferStudentModal.tsx",
    "src/components/admin/CertificatePrint.tsx",
    "src/components/admin/CertificateTemplateEditor.tsx",
    "src/components/admin/GroupDetailClient.tsx",
    "src/components/admin/GroupRename.tsx",
    "src/components/admin/GroupStudentList.tsx"
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

Write-Host "`n🗑️ Nettoyage fusion terminé."
