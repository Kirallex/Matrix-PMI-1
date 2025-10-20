"use strict";
import powerbi from "powerbi-visuals-api";

export class ExcelDownloader {
    public excelDownloaderMethod(table: HTMLElement, grid: HTMLElement): void {
        const exportBtn = grid.querySelector('#exportBtn') as HTMLButtonElement;
        
        if (!exportBtn) {
            console.error('Export button not found');
            return;
        }

        const exportToExcel = () => {
            try {
                this.exportToXLSXSimple(table);
            } catch (error) {
                console.error('Error exporting to Excel:', error);
            }
        };

        exportBtn.addEventListener('click', exportToExcel);
    }

    private exportToXLSXSimple(table: HTMLElement): void {
        // Извлекаем данные таблицы
        const rows = table.querySelectorAll('tr');
        let csv = '';
        
        for (let i = 0; i < rows.length; i++) {
            const cols = rows[i].querySelectorAll('td, th');
            const row: string[] = [];
            
            for (let j = 0; j < cols.length; j++) {
                let text = cols[j].textContent?.trim() || '';
                text = text.replace(/"/g, '""');
                if (text.includes(',') || text.includes('"') || text.includes('\n')) {
                    text = `"${text}"`;
                }
                row.push(text);
            }
            
            csv += row.join(',') + '\n';
        }

        // Создаем XLSX-подобный файл с UTF-8 BOM для лучшей совместимости
        const bom = '\uFEFF';
        const csvData = bom + csv;
        
        // Пробуем открыть в новом окне (работает в некоторых окружениях)
        this.tryOpenInNewWindow(csvData);
    }

    private tryOpenInNewWindow(csvData: string): void {
        try {
            // Пробуем Data URI подход
            const dataUri = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(csvData);
            const newWindow = window.open(dataUri, '_blank');
            
            if (!newWindow) {
                // Если всплывающие окна заблокированы, показываем модальное окно
                this.showDataModal(csvData);
            }
        } catch (error) {
            // Если Data URI не работает, показываем модальное окно
            console.log('Data URI approach failed, showing modal:', error);
            this.showDataModal(csvData);
        }
    }

    private showDataModal(csvData: string): void {
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.zIndex = '10000';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';

        const modalContent = document.createElement('div');
        modalContent.style.background = 'white';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '5px';
        modalContent.style.maxWidth = '80%';
        modalContent.style.maxHeight = '80%';
        modalContent.style.overflow = 'auto';
        modalContent.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';

        const title = document.createElement('h3');
        title.textContent = 'Export Data to Excel';
        title.style.margin = '0 0 15px 0';
        title.style.color = '#333';
        modalContent.appendChild(title);

        const instructions = document.createElement('p');
        instructions.textContent = 'Copy the data below and paste it into Excel:';
        instructions.style.margin = '0 0 10px 0';
        instructions.style.color = '#666';
        modalContent.appendChild(instructions);

        const textarea = document.createElement('textarea');
        textarea.value = csvData;
        textarea.style.width = '100%';
        textarea.style.height = '200px';
        textarea.style.margin = '10px 0';
        textarea.style.padding = '10px';
        textarea.style.border = '1px solid #ddd';
        textarea.style.borderRadius = '3px';
        textarea.style.fontFamily = 'monospace';
        textarea.style.resize = 'none';
        textarea.readOnly = true;
        modalContent.appendChild(textarea);

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.justifyContent = 'flex-end';

        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy to Clipboard';
        copyButton.style.padding = '8px 16px';
        copyButton.style.backgroundColor = '#0078d4';
        copyButton.style.color = 'white';
        copyButton.style.border = 'none';
        copyButton.style.borderRadius = '3px';
        copyButton.style.cursor = 'pointer';
        
        copyButton.onclick = () => {
            textarea.select();
            const successful = document.execCommand('copy');
            if (successful) {
                copyButton.textContent = 'Copied!';
                copyButton.style.backgroundColor = '#107c10';
                setTimeout(() => {
                    copyButton.textContent = 'Copy to Clipboard';
                    copyButton.style.backgroundColor = '#0078d4';
                }, 2000);
            } else {
                alert('Failed to copy data. Please select and copy manually.');
            }
        };

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.padding = '8px 16px';
        closeButton.style.backgroundColor = '#f0f0f0';
        closeButton.style.color = '#333';
        closeButton.style.border = '1px solid #ccc';
        closeButton.style.borderRadius = '3px';
        closeButton.style.cursor = 'pointer';
        
        closeButton.onclick = () => {
            document.body.removeChild(modal);
        };

        buttonContainer.appendChild(copyButton);
        buttonContainer.appendChild(closeButton);
        modalContent.appendChild(buttonContainer);

        modal.appendChild(modalContent);
        
        // Закрытие по клику вне модального окна
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };
        
        document.body.appendChild(modal);
        
        // Авто-выделение текста для удобства
        setTimeout(() => {
            textarea.select();
        }, 100);
    }
}
// "use strict";
// import powerbi from "powerbi-visuals-api";

// export class ExcelDownloader {
//     public excelDownloaderMethod(table: HTMLElement, grid: HTMLElement): void {
//         const exportBtn = grid.querySelector('#exportBtn') as HTMLButtonElement;
        
//         if (!exportBtn) {
//             console.error('Export button not found');
//             return;
//         }

//         const exportToExcel = () => {
//             try {
//                 this.exportToXLSXSimple(table);
//             } catch (error) {
//                 console.error('Error exporting to Excel:', error);
//             }
//         };

//         exportBtn.addEventListener('click', exportToExcel);
//     }

//     private exportToXLSXSimple(table: HTMLElement): void {
//         // Извлекаем данные таблицы
//         const rows = table.querySelectorAll('tr');
//         let csv = '';
        
//         for (let i = 0; i < rows.length; i++) {
//             const cols = rows[i].querySelectorAll('td, th');
//             const row: string[] = [];
            
//             for (let j = 0; j < cols.length; j++) {
//                 let text = cols[j].textContent?.trim() || '';
//                 text = text.replace(/"/g, '""');
//                 if (text.includes(',') || text.includes('"') || text.includes('\n')) {
//                     text = `"${text}"`;
//                 }
//                 row.push(text);
//             }
            
//             csv += row.join(',') + '\n';
//         }

//         // Создаем XLSX-подобный файл с UTF-8 BOM для лучшей совместимости
//         const bom = '\uFEFF';
//         const blob = new Blob([bom + csv], { 
//             type: 'application/vnd.ms-excel;charset=utf-8' 
//         });
        
//         const link = document.createElement('a');
//         const url = URL.createObjectURL(blob);
        
//         link.setAttribute('href', url);
//         link.setAttribute('download', 'Export.xlsx');
//         link.style.visibility = 'hidden';
        
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         URL.revokeObjectURL(url);
//     }
// }