// Brand palette for Shree (single source of truth on the backend).
// Mirrors the frontend theme tokens. Email templates inline these hex values
// (email clients ignore CSS variables); UI code must use the variables/tokens.

export const BRAND = {
  primary: "#FFAFCC", // bubblegum pink — main buttons, highlights
  primarySoft: "#FFC8DD", // light pink — hovers, badges, section backgrounds
  bg: "#FEF8E1", // cream — page background
  surface: "#FAEBCC", // sand — cards, navbar, footer, input fill
  accent: "#D0A375", // tan/caramel — borders, jewellery highlights, decoration
  text: "#4A3426", // dark brown — ALL body text and headings
  textMuted: "#8A7261", // muted brown — secondary text
};
