import { NextResponse } from "next/server";
import { getHistoryRecords } from "@/lib/history";

export async function GET() {
  const history = getHistoryRecords();
  return NextResponse.json({
    history,
    has_more: false,
    last_history_item_id: history.length > 0 ? history[0].history_item_id : null
  });
}
