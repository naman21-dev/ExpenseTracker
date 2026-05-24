import * as XLSX from 'xlsx';

export const exportToExcel = (data, fileName = "transactions") => {
    if (!data || data.length === 0) {
        alert("No data to export!");
        return;
    }

    try {
        // Create a worksheet from JSON data
        const worksheet = XLSX.utils.json_to_sheet(data);
        
        // Create a new workbook
        const workbook = XLSX.utils.book_new();
        
        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

        // Generate an Excel file and trigger the automatic download
        XLSX.writeFile(workbook, `${fileName}.xlsx`, {
            bookType: 'xlsx',
            type: 'array'
        });

    } catch (error) {
        console.error("Export error:", error);
        alert("Error in exporting data, please try again later.");
    }
};