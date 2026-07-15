import { create } from 'zustand';

/**
 * Shared open state so the floating glass tab bar can hide while More is
 * presented. MoreSheet lives inside each tab screen (below the absolute tab
 * bar), so without this the tabs sit on top of the sheet and block the footer.
 */
type MoreSheetState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useMoreSheetOpen = create<MoreSheetState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
