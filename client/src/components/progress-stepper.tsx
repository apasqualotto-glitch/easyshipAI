interface ProgressStepperProps {
  currentStep: number;
}

export default function ProgressStepper({ currentStep }: ProgressStepperProps) {
  const steps = [
    { number: 1, label: "Route" },
    { number: 2, label: "Cargo" },
    { number: 3, label: "Quote" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.number <= currentStep 
                  ? "bg-primary-500 text-white" 
                  : "bg-gray-200 text-gray-500"
              }`}>
                {step.number}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step.number <= currentStep 
                  ? "text-primary-600" 
                  : "text-gray-500"
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
