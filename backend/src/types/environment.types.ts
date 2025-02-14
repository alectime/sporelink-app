export interface EnvironmentData {
  temperature: number | null;
  humidity: number | null;
  notes: string;
  lastUpdate: Date | null;
  history: EnvironmentHistoryEntry[];
}

export interface EnvironmentHistoryEntry {
  timestamp: Date;
  temperature: number;
  humidity: number;
} 