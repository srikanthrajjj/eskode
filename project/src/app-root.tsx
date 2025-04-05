import React from 'react';
import { PoliceApp } from './components/PoliceApp.native';

export function AppRoot() {
  return (
    <PoliceApp 
      onBack={() => {}}
      messages={[]}
      officerId="DC 12345"
    />
  );
}