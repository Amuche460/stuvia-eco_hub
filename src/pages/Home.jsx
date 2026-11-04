import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UNIVERSITIES, COVENANT_DEPARTMENTS, STORAGE_KEYS } from '@/lib/stuviaInstitutions';
import StuviaGatewayShell from '@/components/gateway/StuviaBrandHeader';
import GatewayAuthStep from '@/components/gateway/GatewayAuthStep';
import FindInstitutionStep from '@/components/gateway/FindInstitutionStep';
import RequestInstitutionStep from '@/components/gateway/RequestInstitutionStep';
import SelectDepartmentStep from '@/components/gateway/SelectDepartmentStep';
import DepartmentComingSoonHub from '@/components/gateway/DepartmentComingSoonHub';
import NesaEcoHub from '@/components/gateway/NesaEcoHub';

function readStoredJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Home() {
  const [user, setUser] = useState(() => readStoredJson(STORAGE_KEYS.USER));
  const [university, setUniversity] = useState(() => readStoredJson(STORAGE_KEYS.UNIVERSITY));
  const [department, setDepartment] = useState(() => readStoredJson(STORAGE_KEYS.DEPARTMENT));
  const [requestInitialName, setRequestInitialName] = useState('');

  // Determine active step in the gateway when no department is active
  const [step, setStep] = useState(() => {
    const savedUser = readStoredJson(STORAGE_KEYS.USER);
    const savedUni = readStoredJson(STORAGE_KEYS.UNIVERSITY);
    if (!savedUser) return 'auth';
    if (savedUni?.active) return 'department';
    return 'institution';
  });

  const handleAuthenticated = (userObj) => {
    setUser(userObj);
    setStep('institution');
  };

  const handleSelectUniversity = (uni) => {
    if (uni.active) {
      setUniversity(uni);
      localStorage.setItem(STORAGE_KEYS.UNIVERSITY, JSON.stringify(uni));
      setStep('department');
    } else {
      setRequestInitialName(uni.name);
      setStep('request');
    }
  };

  const handleRequestNewInstitution = (prefill = '') => {
    setRequestInitialName(prefill);
    setStep('request');
  };

  const handleSelectDepartment = (dept) => {
    setDepartment(dept);
    localStorage.setItem(STORAGE_KEYS.DEPARTMENT, JSON.stringify(dept));
  };

  const handleSwitchDepartment = () => {
    setDepartment(null);
    localStorage.removeItem(STORAGE_KEYS.DEPARTMENT);
    const covenant = UNIVERSITIES.find((u) => u.id === 'covenant');
    if (!university) {
      setUniversity(covenant);
      localStorage.setItem(STORAGE_KEYS.UNIVERSITY, JSON.stringify(covenant));
    }
    setStep('department');
  };

  const handleSignOutGateway = () => {
    setUser(null);
    setUniversity(null);
    setDepartment(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.UNIVERSITY);
    localStorage.removeItem(STORAGE_KEYS.DEPARTMENT);
    setStep('auth');
  };

  // Once a department is selected under Covenant University, load that department's hub
  if (department) {
    if (department.id === 'nesa') {
      return <NesaEcoHub onSwitchDepartment={handleSwitchDepartment} />;
    }
    return (
      <DepartmentComingSoonHub
        department={department}
        onSwitchDepartment={handleSwitchDepartment}
        onOpenNesa={() => {
          const nesa = COVENANT_DEPARTMENTS.find((d) => d.id === 'nesa');
          handleSelectDepartment(nesa);
        }}
      />
    );
  }

  return (
    <StuviaGatewayShell
      topRight={
        user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOutGateway}
            className="text-xs text-stone-600 dark:text-gray-300 hover:text-red-600"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Sign Out
          </Button>
        )
      }
    >
      {step === 'auth' && <GatewayAuthStep onAuthenticated={handleAuthenticated} />}

      {step === 'institution' && (
        <FindInstitutionStep
          onSelectUniversity={handleSelectUniversity}
          onRequestNewInstitution={handleRequestNewInstitution}
        />
      )}

      {step === 'request' && (
        <RequestInstitutionStep
          initialName={requestInitialName}
          user={user}
          onBack={() => setStep('institution')}
        />
      )}

      {step === 'department' && (
        <SelectDepartmentStep
          university={university}
          onSelectDepartment={handleSelectDepartment}
          onChangeUniversity={() => {
            setUniversity(null);
            localStorage.removeItem(STORAGE_KEYS.UNIVERSITY);
            setStep('institution');
          }}
        />
      )}
    </StuviaGatewayShell>
  );
}