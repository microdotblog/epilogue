import React from "react";

export const SidebarVisibleContext = React.createContext(false);

// Home owns shelf loading and selection; the sidebar only presents that state.
export const SidebarBookshelvesContext = React.createContext(null);
