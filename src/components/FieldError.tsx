interface FieldErrorProps {
  message: string;
}

export default function FieldError({ message }: FieldErrorProps) {
  return (
    <p className="text-red-600 text-sm mt-1" role="alert">
      {message}
    </p>
  );
}
