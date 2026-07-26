with open('src/lib/audit.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Supprimer la première ligne si c'est "use server"
if lines[0].strip() == '"use server"':
    lines = lines[1:]
    # Supprimer une ligne vide éventuelle en début
    if lines and lines[0].strip() == '':
        lines = lines[1:]

with open('src/lib/audit.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('ok')
