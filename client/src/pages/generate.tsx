import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Generate() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/create");
  }, [setLocation]);

  return null;
}
