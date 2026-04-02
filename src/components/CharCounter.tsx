interface CharCounterProps {
  current: number;
  minimum: number;
}

export default function CharCounter({ current, minimum }: CharCounterProps) {
  const met = current >= minimum;
  return (
    <p className={`text-sm mt-1 ${met ? 'text-primary' : 'text-text-secondary'}`}>
      {current} / {minimum} minimum characters{met ? ' ✓' : ''}
    </p>
  );
}
