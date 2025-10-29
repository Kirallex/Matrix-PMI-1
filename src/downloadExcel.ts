"use strict";
import powerbi from "powerbi-visuals-api";
import "./../style/excelDownloadModal.css"

export class ExcelDownloader {
    public excelDownloaderMethod(table: HTMLElement, grid: HTMLElement): void {
        const exportBtn = grid.querySelector('#exportBtn') as HTMLButtonElement;
        
        if (!exportBtn) {
            console.error('Export button not found');
            return;
        }

        const exportToExcel = () => {
            try {
                this.exportToCSV(table);
            } catch (error) {
                console.error('Error exporting to CSV:', error);
            }
        };

        exportBtn.addEventListener('click', exportToExcel);
    }

    private exportToCSV(table: HTMLElement): void {
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

        const bom = '\uFEFF';
        const csvData = bom + csv;
        
        const blob = new Blob([csvData], { 
            type: 'text/csv;charset=utf-8' 
        });
        
        const blobUrl = URL.createObjectURL(blob);
        
        this.showDownloadModal(blobUrl);
    }

    private showDownloadModal(blobUrl: string): void {
        const modal = document.createElement('div');
        modal.className = 'excel-download-modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'excel-download-modal-content';

        const title = document.createElement('h3');
        title.textContent = 'Скачать CSV файл';
        title.className = 'excel-download-modal-title';
        modalContent.appendChild(title);

        const instruction = document.createElement('p');
        instruction.textContent = 'Скопируйте ссылку ниже, вставьте в отдельную вкладку браузера и нажмите Enter';
        instruction.className = 'excel-download-modal-instruction';
        modalContent.appendChild(instruction);

        const linkContainer = document.createElement('div');
        linkContainer.className = 'excel-download-modal-link-container';

        const linkInput = document.createElement('input');
        linkInput.type = 'text';
        linkInput.value = blobUrl;
        linkInput.readOnly = true;
        linkInput.className = 'excel-download-modal-link-input';
        
        linkInput.addEventListener('focus', () => {
            linkInput.select();
        });

        const copyButton = document.createElement('button');
        copyButton.textContent = 'Копировать';
        copyButton.className = 'excel-download-modal-copy-button';
        
        copyButton.onclick = () => {
            this.copyToClipboard(blobUrl, copyButton);
        };

        linkContainer.appendChild(linkInput);
        linkContainer.appendChild(copyButton);
        modalContent.appendChild(linkContainer);

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Закрыть';
        closeButton.className = 'excel-download-modal-close-button';

        closeButton.onclick = () => {
            URL.revokeObjectURL(blobUrl);
            document.body.removeChild(modal);
        };

        modalContent.appendChild(closeButton);
        modal.appendChild(modalContent);

        modal.onclick = (e) => {
            if (e.target === modal) {
                URL.revokeObjectURL(blobUrl);
                document.body.removeChild(modal);
            }
        };

        document.body.appendChild(modal);

        setTimeout(() => {
            linkInput.select();
        }, 100);
    }

    private copyToClipboard(text: string, button: HTMLButtonElement): void {
        const originalText = button.textContent;
        
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                button.textContent = 'Скопировано!';
                button.classList.add('copied');
            } else {
                button.textContent = 'Ошибка';
                button.classList.add('error');
            }
        } catch (err) {
            button.textContent = 'Ошибка';
            button.classList.add('error');
        }
        
        document.body.removeChild(textArea);

        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied', 'error');
        }, 2000);
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
//                 this.exportToCSV(table);
//             } catch (error) {
//                 console.error('Error exporting to CSV:', error);
//             }
//         };

//         exportBtn.addEventListener('click', exportToExcel);
//     }

//     private exportToCSV(table: HTMLElement): void {
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

//         // Создаем CSV файл с UTF-8 BOM
//         const bom = '\uFEFF';
//         const csvData = bom + csv;
        
//         // Создаем Blob для CSV
//         const blob = new Blob([csvData], { 
//             type: 'text/csv;charset=utf-8' 
//         });
        
//         // Создаем Blob URL
//         const blobUrl = URL.createObjectURL(blob);
        
//         // Показываем модальное окно со ссылкой
//         this.showDownloadModal(blobUrl);
//     }

//     private showDownloadModal(blobUrl: string): void {
//         // Создаем модальное окно
//         const modal = document.createElement('div');
//         modal.style.position = 'fixed';
//         modal.style.top = '0';
//         modal.style.left = '0';
//         modal.style.width = '100%';
//         modal.style.height = '100%';
//         modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
//         modal.style.zIndex = '10000';
//         modal.style.display = 'flex';
//         modal.style.justifyContent = 'center';
//         modal.style.alignItems = 'center';

//         const modalContent = document.createElement('div');
//         modalContent.style.background = 'white';
//         modalContent.style.padding = '20px';
//         modalContent.style.borderRadius = '5px';
//         modalContent.style.maxWidth = '500px';
//         modalContent.style.width = '90%';
//         modalContent.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';

//         // Заголовок
//         const title = document.createElement('h3');
//         title.textContent = 'Скачать CSV файл';
//         title.style.margin = '0 0 15px 0';
//         title.style.color = '#333';
//         modalContent.appendChild(title);

//         // Инструкция
//         const instruction = document.createElement('p');
//         instruction.textContent = 'Скопируйте ссылку ниже, вставьте в отдельную вкладку браузера и нажмите Enter';
//         instruction.style.margin = '0 0 15px 0';
//         instruction.style.color = '#666';
//         instruction.style.fontSize = '14px';
//         modalContent.appendChild(instruction);

//         // Контейнер для ссылки
//         const linkContainer = document.createElement('div');
//         linkContainer.style.display = 'flex';
//         linkContainer.style.gap = '10px';
//         linkContainer.style.marginBottom = '15px';

//         // Поле с ссылкой
//         const linkInput = document.createElement('input');
//         linkInput.type = 'text';
//         linkInput.value = blobUrl;
//         linkInput.readOnly = true;
//         linkInput.style.flex = '1';
//         linkInput.style.padding = '10px';
//         linkInput.style.border = '1px solid #ddd';
//         linkInput.style.borderRadius = '3px';
//         linkInput.style.fontSize = '14px';
        
//         // Автовыделение при фокусе
//         linkInput.addEventListener('focus', () => {
//             linkInput.select();
//         });

//         // Кнопка копирования
//         const copyButton = document.createElement('button');
//         copyButton.textContent = 'Копировать';
//         copyButton.style.padding = '10px 15px';
//         copyButton.style.background = '#0078d4';
//         copyButton.style.color = 'white';
//         copyButton.style.border = 'none';
//         copyButton.style.borderRadius = '3px';
//         copyButton.style.cursor = 'pointer';
//         copyButton.style.fontSize = '14px';
        
//         copyButton.onclick = () => {
//             this.copyToClipboard(blobUrl, copyButton);
//         };

//         linkContainer.appendChild(linkInput);
//         linkContainer.appendChild(copyButton);
//         modalContent.appendChild(linkContainer);

//         // Кнопка закрытия
//         const closeButton = document.createElement('button');
//         closeButton.textContent = 'Закрыть';
//         closeButton.style.padding = '8px 16px';
//         closeButton.style.background = '#f0f0f0';
//         closeButton.style.color = '#333';
//         closeButton.style.border = '1px solid #ccc';
//         closeButton.style.borderRadius = '3px';
//         closeButton.style.cursor = 'pointer';
//         closeButton.style.marginLeft = 'auto';
//         closeButton.style.display = 'block';

//         closeButton.onclick = () => {
//             // Очищаем Blob URL при закрытии
//             URL.revokeObjectURL(blobUrl);
//             document.body.removeChild(modal);
//         };

//         modalContent.appendChild(closeButton);
//         modal.appendChild(modalContent);

//         // Закрытие по клику вне модального окна
//         modal.onclick = (e) => {
//             if (e.target === modal) {
//                 URL.revokeObjectURL(blobUrl);
//                 document.body.removeChild(modal);
//             }
//         };

//         document.body.appendChild(modal);

//         // Авто-выделение ссылки
//         setTimeout(() => {
//             linkInput.select();
//         }, 100);
//     }

//     private copyToClipboard(text: string, button: HTMLButtonElement): void {
//         const originalText = button.textContent;
        
//         // Создаем временный элемент для копирования
//         const textArea = document.createElement('textarea');
//         textArea.value = text;
//         textArea.style.position = 'fixed';
//         textArea.style.opacity = '0';
//         document.body.appendChild(textArea);
//         textArea.select();
        
//         try {
//             const successful = document.execCommand('copy');
//             if (successful) {
//                 button.textContent = 'Скопировано!';
//                 button.style.background = '#107c10';
//             } else {
//                 button.textContent = 'Ошибка';
//                 button.style.background = '#e74c3c';
//             }
//         } catch (err) {
//             button.textContent = 'Ошибка';
//             button.style.background = '#e74c3c';
//         }
        
//         document.body.removeChild(textArea);

//         // Возвращаем оригинальный текст через 2 секунды
//         setTimeout(() => {
//             button.textContent = originalText;
//             button.style.background = '#0078d4';
//         }, 2000);
//     }
// }















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
//                 this.exportToXLSXWithModal(table);
//             } catch (error) {
//                 console.error('Error exporting to Excel:', error);
//             }
//         };

//         exportBtn.addEventListener('click', exportToExcel);
//     }

//     private exportToXLSXWithModal(table: HTMLElement): void {
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

//         // Создаем XLSX-подобный файл с UTF-8 BOM
//         const bom = '\uFEFF';
//         const csvData = bom + csv;
        
//         // Создаем Blob с правильным MIME type для Excel
//         const blob = new Blob([csvData], { 
//             type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' 
//         });
        
//         // Создаем Blob URL
//         const blobUrl = URL.createObjectURL(blob);
        
//         // Показываем модальное окно со ссылкой
//         this.showDownloadModal(blobUrl);
//     }

//     private showDownloadModal(blobUrl: string): void {
//         // Создаем модальное окно
//         const modal = document.createElement('div');
//         modal.style.position = 'fixed';
//         modal.style.top = '0';
//         modal.style.left = '0';
//         modal.style.width = '100%';
//         modal.style.height = '100%';
//         modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
//         modal.style.zIndex = '10000';
//         modal.style.display = 'flex';
//         modal.style.justifyContent = 'center';
//         modal.style.alignItems = 'center';
//         modal.style.fontFamily = 'Segoe UI, Arial, sans-serif';

//         const modalContent = document.createElement('div');
//         modalContent.style.background = 'white';
//         modalContent.style.padding = '30px';
//         modalContent.style.borderRadius = '8px';
//         modalContent.style.maxWidth = '600px';
//         modalContent.style.width = '90%';
//         modalContent.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
//         modalContent.style.position = 'relative';

//         // Заголовок
//         const title = document.createElement('h2');
//         title.textContent = '📊 Скачать Excel файл';
//         title.style.margin = '0 0 20px 0';
//         title.style.color = '#2c3e50';
//         title.style.fontSize = '24px';
//         title.style.fontWeight = '600';
//         modalContent.appendChild(title);

//         // Инструкция
//         const instruction = document.createElement('p');
//         instruction.innerHTML = `
//             <strong>Инструкция по скачиванию:</strong><br>
//             1. Скопируйте ссылку ниже<br>
//             2. Вставьте в отдельную вкладку браузера<br>
//             3. Нажмите Enter для скачивания файла
//         `;
//         instruction.style.margin = '0 0 25px 0';
//         instruction.style.color = '#5a6268';
//         instruction.style.fontSize = '15px';
//         instruction.style.lineHeight = '1.5';
//         instruction.style.padding = '15px';
//         instruction.style.background = '#f8f9fa';
//         instruction.style.borderRadius = '5px';
//         instruction.style.borderLeft = '4px solid #3498db';
//         modalContent.appendChild(instruction);

//         // Контейнер для ссылки
//         const linkContainer = document.createElement('div');
//         linkContainer.style.display = 'flex';
//         linkContainer.style.flexDirection = 'column';
//         linkContainer.style.gap = '10px';
//         linkContainer.style.marginBottom = '25px';

//         // Метка для поля ссылки
//         const linkLabel = document.createElement('label');
//         linkLabel.textContent = 'Ссылка для скачивания:';
//         linkLabel.style.fontWeight = '600';
//         linkLabel.style.color = '#495057';
//         linkLabel.style.fontSize = '14px';
//         linkContainer.appendChild(linkLabel);

//         // Контейнер для поля ввода и кнопки
//         const inputGroup = document.createElement('div');
//         inputGroup.style.display = 'flex';
//         inputGroup.style.gap = '8px';

//         // Поле с ссылкой
//         const linkInput = document.createElement('input');
//         linkInput.type = 'text';
//         linkInput.value = blobUrl;
//         linkInput.readOnly = true;
//         linkInput.style.flex = '1';
//         linkInput.style.padding = '12px 15px';
//         linkInput.style.border = '2px solid #e9ecef';
//         linkInput.style.borderRadius = '5px';
//         linkInput.style.fontSize = '14px';
//         linkInput.style.background = '#f8f9fa';
//         linkInput.style.cursor = 'text';
//         linkInput.style.color = '#495057';
        
//         // Автовыделение при фокусе
//         linkInput.addEventListener('focus', () => {
//             linkInput.select();
//         });

//         // Кнопка копирования
//         const copyButton = document.createElement('button');
//         copyButton.innerHTML = '📋 Копировать';
//         copyButton.style.padding = '12px 20px';
//         copyButton.style.background = '#3498db';
//         copyButton.style.color = 'white';
//         copyButton.style.border = 'none';
//         copyButton.style.borderRadius = '5px';
//         copyButton.style.cursor = 'pointer';
//         copyButton.style.fontSize = '14px';
//         copyButton.style.fontWeight = '600';
//         copyButton.style.transition = 'all 0.2s ease';
//         copyButton.style.whiteSpace = 'nowrap';
        
//         copyButton.addEventListener('mouseover', () => {
//             copyButton.style.background = '#2980b9';
//             copyButton.style.transform = 'translateY(-1px)';
//         });
        
//         copyButton.addEventListener('mouseout', () => {
//             copyButton.style.background = '#3498db';
//             copyButton.style.transform = 'translateY(0)';
//         });

//         copyButton.onclick = () => {
//             this.copyToClipboard(blobUrl, copyButton);
//         };

//         inputGroup.appendChild(linkInput);
//         inputGroup.appendChild(copyButton);
//         linkContainer.appendChild(inputGroup);
//         modalContent.appendChild(linkContainer);

//         // Прямая ссылка для скачивания (может не работать в sandbox, но попробуем)
//         const directDownloadContainer = document.createElement('div');
//         directDownloadContainer.style.marginBottom = '20px';
        
//         const directLink = document.createElement('a');
//         directLink.href = blobUrl;
//         directLink.download = `PowerBI_Export_${this.getFormattedDate()}.xlsx`;
//         directLink.innerHTML = '⬇️ Попробовать прямое скачивание';
//         directLink.style.display = 'inline-block';
//         directLink.style.padding = '12px 20px';
//         directLink.style.background = '#27ae60';
//         directLink.style.color = 'white';
//         directLink.style.textDecoration = 'none';
//         directLink.style.borderRadius = '5px';
//         directLink.style.fontWeight = '600';
//         directLink.style.fontSize = '14px';
//         directLink.style.transition = 'all 0.2s ease';
        
//         directLink.addEventListener('mouseover', () => {
//             directLink.style.background = '#219652';
//             directLink.style.transform = 'translateY(-1px)';
//         });
        
//         directLink.addEventListener('mouseout', () => {
//             directLink.style.background = '#27ae60';
//             directLink.style.transform = 'translateY(0)';
//         });

//         directDownloadContainer.appendChild(directLink);
//         modalContent.appendChild(directDownloadContainer);

//         // Примечание
//         const note = document.createElement('p');
//         note.innerHTML = `
//             <small style="color: #6c757d;">
//                 <strong>Примечание:</strong> Файл будет сохранен с расширением .xlsx. 
//                 Если прямое скачивание не работает, используйте инструкцию выше со копированием ссылки.
//             </small>
//         `;
//         note.style.margin = '15px 0 0 0';
//         note.style.fontSize = '13px';
//         modalContent.appendChild(note);

//         // Кнопка закрытия
//         const closeButton = document.createElement('button');
//         closeButton.textContent = '✕ Закрыть';
//         closeButton.style.position = 'absolute';
//         closeButton.style.top = '15px';
//         closeButton.style.right = '15px';
//         closeButton.style.background = 'none';
//         closeButton.style.border = 'none';
//         closeButton.style.fontSize = '18px';
//         closeButton.style.cursor = 'pointer';
//         closeButton.style.color = '#6c757d';
//         closeButton.style.padding = '5px 10px';
//         closeButton.style.borderRadius = '3px';
        
//         closeButton.addEventListener('mouseover', () => {
//             closeButton.style.background = '#f8f9fa';
//             closeButton.style.color = '#495057';
//         });
        
//         closeButton.addEventListener('mouseout', () => {
//             closeButton.style.background = 'none';
//             closeButton.style.color = '#6c757d';
//         });

//         closeButton.onclick = () => {
//             // Очищаем Blob URL при закрытии
//             URL.revokeObjectURL(blobUrl);
//             document.body.removeChild(modal);
//         };

//         modalContent.appendChild(closeButton);
//         modal.appendChild(modalContent);

//         // Закрытие по клику вне модального окна
//         modal.onclick = (e) => {
//             if (e.target === modal) {
//                 URL.revokeObjectURL(blobUrl);
//                 document.body.removeChild(modal);
//             }
//         };

//         document.body.appendChild(modal);

//         // Авто-выделение ссылки
//         setTimeout(() => {
//             linkInput.select();
//         }, 100);
//     }

//     private copyToClipboard(text: string, button: HTMLButtonElement): void {
//         const originalText = button.innerHTML;
        
//         if (navigator.clipboard && window.isSecureContext) {
//             // Используем modern Clipboard API
//             navigator.clipboard.writeText(text).then(() => {
//                 this.showCopySuccess(button);
//             }).catch(() => {
//                 this.fallbackCopy(text, button);
//             });
//         } else {
//             // Fallback для старых браузеров
//             this.fallbackCopy(text, button);
//         }

//         // Возвращаем оригинальный текст через 2 секунды
//         setTimeout(() => {
//             button.innerHTML = originalText;
//             button.style.background = '#3498db';
//         }, 2000);
//     }

//     private fallbackCopy(text: string, button: HTMLButtonElement): void {
//         const textArea = document.createElement('textarea');
//         textArea.value = text;
//         textArea.style.position = 'fixed';
//         textArea.style.opacity = '0';
//         document.body.appendChild(textArea);
//         textArea.select();
        
//         try {
//             const successful = document.execCommand('copy');
//             if (successful) {
//                 this.showCopySuccess(button);
//             } else {
//                 button.innerHTML = '❌ Ошибка';
//                 button.style.background = '#e74c3c';
//             }
//         } catch (err) {
//             button.innerHTML = '❌ Ошибка';
//             button.style.background = '#e74c3c';
//         }
        
//         document.body.removeChild(textArea);
//     }

//     private showCopySuccess(button: HTMLButtonElement): void {
//         button.innerHTML = '✅ Скопировано!';
//         button.style.background = '#27ae60';
//     }

//     private getFormattedDate(): string {
//         const now = new Date();
//         const year = now.getFullYear();
//         const month = String(now.getMonth() + 1).padStart(2, '0');
//         const day = String(now.getDate()).padStart(2, '0');
//         const hours = String(now.getHours()).padStart(2, '0');
//         const minutes = String(now.getMinutes()).padStart(2, '0');
        
//         return `${year}-${month}-${day}_${hours}-${minutes}`;
//     }
// }




















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