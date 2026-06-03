import React, { useState } from "react";
import StepOneScreen from "./StepOneScreen";
import StepTwoScreen from "./StepTwoScreen";
import StepThreeScreen from "./StepThreeScreen";

export default function OnboardingContainer({ userId }) {
  const [step, setStep] = useState(1);

  const [profileData, setProfileData] = useState({});

  const nextStep = (data) => {
    setProfileData((prev) => ({
      ...prev,
      ...data,
    }));
    setStep((prev) => prev + 1);
  };

  const goBack = () => setStep((prev) => prev - 1);

  if (step === 1) {
    return (
      <StepOneScreen
        onNext={nextStep}
      />
    );
  }

  if (step === 2) {
    return (
      <StepTwoScreen
        onNext={nextStep}
        currentWeight={profileData.weight}
        height={profileData.height}
      />
    );
  }

  return (
    <StepThreeScreen
      profileData={profileData}
      userId={userId}
      onComplete={() => console.log("DONE")}
    />
  );
}