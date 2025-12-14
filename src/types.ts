export interface PhotoEntry {
  id: string;
  date: string; // ISO String
  dataUrl: string; // Base64 image
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  streak: number;
  // ISO Date string (YYYY-MM-DD) of the last time this goal was marked complete
  lastCompletedDate: string | null;
  photos: PhotoEntry[];
}

export type ThemeColor = string;
