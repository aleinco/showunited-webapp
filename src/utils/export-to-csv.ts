export function exportToCSV(data: any[], headersOrFileName: string, fileName?: string) {
  if (!data?.length) return;

  const headers = fileName ? headersOrFileName.split(',') : Object.keys(data[0]);
  const outputName = fileName ?? headersOrFileName;
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const cell = row[header] ?? '';
          const escaped = String(cell).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${outputName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
