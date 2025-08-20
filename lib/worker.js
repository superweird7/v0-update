importScripts('https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js');

self.onmessage = async (e) => {
  const { files } = e.data;
  const allData = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const rows = jsonData.slice(1);

    const processedData = rows.map((row, index) => {
      // Your existing processing logic here
      const transactionRow = {
        id: `row-${i}-${index}`,
        reference: Math.random().toString(36).substr(2, 9).toUpperCase(),
        valueDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        payerName: row[2] || '',
        payerAccount: row[3] || '',
        amount: row[4] || '',
        currency: 'IQD',
        receiverBIC: row[6] || '',
        beneficiaryAccount: row[8] || '',
        beneficiaryName: row[7] || '',
        remittanceInformation: row[9] || '',
        detailsOfCharges: 'SLEV',
      };
      return transactionRow;
    });

    allData.push(...processedData);
    
    // Post progress back to the main thread
    self.postMessage({ type: 'progress', progress: ((i + 1) / files.length) * 100 });
  }

  // Final data processing and posting back
  const combinedData = allData.map((row, index) => ({
    ...row,
    id: `combined-row-${index}`,
  }));

  self.postMessage({ type: 'result', data: combinedData });
};