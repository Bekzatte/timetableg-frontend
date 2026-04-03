import { ThemeContext } from "./ThemeContextValue";

export const ThemeProvider = ({ children }) => {
  // Always use light theme
  const theme = "light";

  return (
    <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>
  );
};
