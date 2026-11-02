import { load as loadState, save as saveState } from "../../../store/state.js";

export async function loadReadingPosition() {
  try {
    const state = await loadState();
    return state?.readingPosition || null;
  } catch {
    return null;
  }
}

export async function saveReadingPosition(position) {
  try {
    const state = await loadState();
    state.readingPosition = position;
    await saveState(state);
    return true;
  } catch {
    return false;
  }
}
