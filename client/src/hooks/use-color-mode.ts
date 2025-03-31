import { useEffect, useState } from "react";

type ColorMode = "light" | "dark";

export function useColorMode() {
  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    // Check for saved preference
    const savedMode = localStorage.getItem("color-mode") as ColorMode | null;
    
    if (savedMode) {
      return savedMode;
    }
    
    // Check for system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return "dark";
    }
    
    return "light";
  });
  
  useEffect(() => {
    // Set the class on document element
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(colorMode);
    
    // Save the preference
    localStorage.setItem("color-mode", colorMode);
  }, [colorMode]);

  const toggleColorMode = () => {
    setColorMode(prevMode => (prevMode === "light" ? "dark" : "light"));
  };

  return { colorMode, toggleColorMode };
}
