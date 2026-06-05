import re

with open("frontend/src/pages/Simulator.jsx", "r") as f:
    content = f.read()

# SEVERITY_COLORS
content = content.replace("'bg-red-900/60 text-red-400 border border-red-700'", "'bg-red-50 text-red-600 border border-red-200'")
content = content.replace("'bg-amber-900/60 text-amber-400 border border-amber-700'", "'bg-amber-50 text-amber-600 border border-amber-200'")
content = content.replace("'bg-blue-900/60 text-blue-400 border border-blue-700'", "'bg-blue-50 text-blue-600 border border-blue-200'")
content = content.replace("'bg-green-900/60 text-green-400 border border-green-700'", "'bg-emerald-50 text-emerald-600 border border-emerald-200'")

# BLAST_COLORS
content = content.replace("text: 'text-emerald-400', bg: 'bg-emerald-900/30'", "text: 'text-emerald-700', bg: 'bg-emerald-50'")
content = content.replace("text: 'text-green-400', bg: 'bg-green-900/30'", "text: 'text-emerald-700', bg: 'bg-emerald-50'")
content = content.replace("text: 'text-blue-400', bg: 'bg-blue-900/30'", "text: 'text-blue-700', bg: 'bg-blue-50'")
content = content.replace("text: 'text-amber-400', bg: 'bg-amber-900/30'", "text: 'text-amber-700', bg: 'bg-amber-50'")
content = content.replace("text: 'text-red-400', bg: 'bg-red-900/30'", "text: 'text-red-700', bg: 'bg-red-50'")

# ProcessingStep
content = content.replace("result === 'blocked' ? 'border-l-red-500 bg-red-900/20' :", "result === 'blocked' ? 'border-l-red-500 bg-red-50 text-red-900' :")
content = content.replace("result === 'approved' ? 'border-l-green-500 bg-green-900/20' :", "result === 'approved' ? 'border-l-emerald-500 bg-emerald-50 text-emerald-900' :")
content = content.replace("isActive ? 'border-l-aegis-amber bg-amber-900/10 animate-pulse' :", "isActive ? 'border-l-amber-500 bg-amber-50 text-amber-900 animate-pulse' :")
content = content.replace("'border-l-aegis-border bg-aegis-surface/50'", "'border-l-aegis-border bg-white'")
content = content.replace("text-green-400", "text-emerald-600")
content = content.replace("text-red-400", "text-red-600")

# WITHOUT AEGIS
content = content.replace("bg-red-900/30 text-red-400 p-3 font-bold border-b border-red-900", "bg-red-50 text-red-600 p-3 font-bold border-b border-red-100")
content = content.replace("bg-red-900/20 p-3 rounded border border-red-800 text-sm", "bg-red-50 p-3 rounded border border-red-200 text-sm")
content = content.replace("bg-red-900/30 rounded border border-red-500 text-red-400", "bg-red-50 rounded border border-red-200 text-red-600")
content = content.replace("text-red-300", "text-red-700")

# WITH AEGIS
content = content.replace("border-green-500 shadow-[0_0_30px_rgba(0,255,136,0.25)]", "border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)]")
content = content.replace("bg-green-900/20 text-aegis-green p-3 font-bold border-b border-green-900", "bg-emerald-50 text-emerald-600 p-3 font-bold border-b border-emerald-100")
content = content.replace("border-l-green-500 bg-green-900/10", "border-l-emerald-500 bg-emerald-50")
content = content.replace("bg-red-900/20", "bg-red-50")
content = content.replace("bg-amber-900/10", "bg-amber-50")
content = content.replace("text-amber-400", "text-amber-600")
content = content.replace("bg-red-900/50", "bg-red-100")
content = content.replace("bg-blue-900/10", "bg-blue-50")
content = content.replace("bg-green-900/20", "bg-emerald-50")

with open("frontend/src/pages/Simulator.jsx", "w") as f:
    f.write(content)
