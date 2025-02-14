export const theme = {
  colors: {
    // Primary Colors
    primary: '#080806',    // Off Black - Main text, headers
    secondary: '#f7f7f2',  // Off White - Background, cards
    
    // Accent Colors
    accent1: '#123524',    // Deep Green - Buttons, important actions
    accent2: '#d2b48c',    // Tan - Secondary buttons, highlights
    
    // Neutral Colors
    neutral1: '#c0beb7',   // Light Grey - Borders, dividers
    neutral2: '#a9a9a9',   // Medium Grey - Secondary text
    neutral3: '#f1efea',   // Lightest Grey - Background variations
    
    // Functional Colors
    success: '#123524',    // Deep Green for success states
    error: '#d2b48c',      // Tan for error states
    warning: '#c0beb7',    // Grey for warning states
  },
  
  // Typography
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      color: '#080806',
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      color: '#080806',
    },
    body: {
      fontSize: 16,
      color: '#080806',
    },
    caption: {
      fontSize: 14,
      color: '#a9a9a9',
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  // Border Radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  
  // Shadows
  shadows: {
    small: {
      shadowColor: '#080806',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#080806',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  },
}; 