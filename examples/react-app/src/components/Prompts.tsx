interface PromptsProps {
  prompts: string[];
}

export default function Prompts({ prompts }: PromptsProps) {
  return (
    <div className="mt-5 bg-gray-50 rounded-lg p-4">
      <div className="font-bold text-primary mb-3 flex items-center gap-2 text-sm">
        💬 Try These Prompts
      </div>
      <ul className="space-y-2">
        {prompts.map((prompt, idx) => (
          <li key={idx} className="prompt-item">
            💬 {prompt}
          </li>
        ))}
      </ul>
    </div>
  );
}

