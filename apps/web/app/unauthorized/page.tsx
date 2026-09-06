import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="p-10 text-center text-xl">
      Unauthorized access{' '}
      <Link href="/quizzes" className="text-indigo-600 hover:underline">
        Back to Quizzes
      </Link>
    </div>
  );
}