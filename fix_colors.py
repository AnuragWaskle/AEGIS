import os

files_to_fix = [
    "frontend/src/pages/Dashboard.jsx",
    "frontend/src/pages/AuditLog.jsx"
]

for filepath in files_to_fix:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace light text colors with darker ones suitable for light backgrounds
    content = content.replace("text-red-400", "text-red-600")
    content = content.replace("text-amber-400", "text-amber-600")
    content = content.replace("text-blue-400", "text-blue-600")
    content = content.replace("text-green-400", "text-emerald-600")
    content = content.replace("text-emerald-400", "text-emerald-600")
    
    with open(filepath, 'w') as f:
        f.write(content)

print("Fixed colors.")
