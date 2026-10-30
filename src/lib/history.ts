export interface HistoryRecord {
  history_item_id: string;
  voice_id: string;
  voice_name: string;
  voice_category: string;
  text: string;
  duration_seconds: number;
  created_at_unix: number;
  model_id: string;
  audio_base64?: string;
}

let historyRecords: HistoryRecord[] = [];

export function addHistoryRecord(record: Omit<HistoryRecord, "history_item_id" | "created_at_unix">): HistoryRecord {
  const item: HistoryRecord = {
    ...record,
    history_item_id: "hist_" + Math.random().toString(36).substring(2, 10),
    created_at_unix: Math.floor(Date.now() / 1000)
  };
  historyRecords.unshift(item);
  // Keep max 50 recent items in memory
  if (historyRecords.length > 50) {
    historyRecords.pop();
  }
  return item;
}

export function getHistoryRecords(): HistoryRecord[] {
  return historyRecords;
}

export function getHistoryRecordById(id: string): HistoryRecord | undefined {
  return historyRecords.find(h => h.history_item_id === id);
}

export function deleteHistoryRecord(id: string): boolean {
  const len = historyRecords.length;
  historyRecords = historyRecords.filter(h => h.history_item_id !== id);
  return historyRecords.length < len;
}
