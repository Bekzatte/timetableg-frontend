import React, { createContext } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Always use light theme
  const theme = "light";

  return (
    <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
