interface AgentBadgeProps {
  name: string
  label: string
}

function getAgentStyle(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('logic'))
    return 'text-purple-700 bg-purple-50 border-purple-200'
  if (lower.includes('evidence') || lower.includes('scholar'))
    return 'text-orange-700 bg-orange-50 border-orange-200'
  if (lower.includes('red') || lower.includes('adversar'))
    return 'text-red-700 bg-red-50 border-red-200'
  if (lower.includes('compress') || lower.includes('redundancy'))
    return 'text-gray-700 bg-gray-50 border-gray-200'
  if (lower.includes('calibration'))
    return 'text-blue-700 bg-blue-50 border-blue-200'
  if (lower.includes('base'))
    return 'text-teal-700 bg-teal-50 border-teal-200'
  return 'text-gray-700 bg-gray-50 border-gray-200'
}

export default function AgentBadge({ name, label }: AgentBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${getAgentStyle(name)}`}
    >
      <span className="opacity-70">&#x1F916;</span>
      {name}: {label}
    </span>
  )
}
