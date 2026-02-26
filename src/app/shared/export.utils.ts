/**
 * CSV Export Utility — SGI OMC
 * Exports data arrays to CSV files with French locale support.
 */

export function exportToCsv<T extends Record<string, unknown>>(
    filename: string,
    data: T[],
    columns: { key: string; label: string }[]
): void {
    if (!data.length) return;

    const BOM = '\uFEFF'; // UTF-8 BOM for Excel
    const sep = ';'; // French Excel uses semicolons

    const header = columns.map((c) => `"${c.label}"`).join(sep);
    const rows = data.map((row) =>
        columns
            .map((c) => {
                const val = row[c.key];
                if (val == null) return '""';
                const str = String(val).replace(/"/g, '""');
                return `"${str}"`;
            })
            .join(sep)
    );

    const csv = BOM + [header, ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Print the current page content area.
 */
export function printPage(): void {
    window.print();
}
