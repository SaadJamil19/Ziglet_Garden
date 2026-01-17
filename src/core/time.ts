/**
 * Core Time System
 * Rule: All times must be UTC.
 * Rule: Garden Day resets at 00:00 UTC.
 */

/**
 * Returns the current Garden Day in YYYY-MM-DD format (UTC).
 * This is the source of truth for "Today".
 */
export function getCurrentGardenDay(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

/**
 * Returns the current UTC timestamp (ISO string).
 */
export function getNowUTC(): string {
    return new Date().toISOString();
}

/**
 * Calculates the expiration time for a nonce (e.g., 5 minutes from now).
 */
export function getNonceExpiry(minutes: number = 5): Date {
    const now = new Date();
    return new Date(now.getTime() + minutes * 60000);
}

/**
 * Helper to check if a "Garden Day" has passed between two dates.
 * @param lastDateStr YYYY-MM-DD
 * @param currentDateStr YYYY-MM-DD
 */
export function isNextDay(lastDateStr: string, currentDateStr: string): boolean {
    const last = new Date(lastDateStr);
    const current = new Date(currentDateStr);

    // Calculate difference in time
    const diffTime = current.getTime() - last.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);

    return diffDays >= 1;
}

export function getDaysDifference(date1Str: string, date2Str: string): number {
    const d1 = new Date(date1Str);
    const d2 = new Date(date2Str);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
