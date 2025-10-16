import ProblemPane from "./problem-pane";

export default function ProblemSession({ data, onBack }) {
  const problem = data?.question;

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-gray-200">
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-sm px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
          >
            ← Back
          </button>
          <h2 className="text-lg font-semibold text-white">
            {problem?.questionFrontendId ? `${problem.questionFrontendId}. ` : ""}
            {problem?.title || "Problem"}
          </h2>
        </div>

        <div />
      </div>

      <div className="flex-1 overflow-auto p-4">
        <ProblemPane problem={problem} />
      </div>
    </div>
  );
}
