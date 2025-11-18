export default function ProgressModal({ progress }: { progress: number }) {
  if (progress === 0 || progress === 100) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Generating Diagram...</h2>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-500 h-4 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-center mt-4">{progress}% complete</p>
      </div>
    </div>
  );
}
