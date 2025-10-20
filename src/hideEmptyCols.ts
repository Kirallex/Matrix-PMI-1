"use strict"

export class MatrixEmptyColumnsHider {
    public hideEmptyColsMethod(table: HTMLElement): void {
        const datagrid = table.querySelector('.datagrid table');
        let midRows = datagrid.getElementsByClassName('midRow');
        let topRows = datagrid.getElementsByClassName('topRow');
        let colCount:number = 0;
        let currentRow: NodeListOf<HTMLTableCellElement>;
        let currentCell: HTMLTableCellElement;
        let emptyIds = [];
        //console.log(colCount);

        for (let colNum = 0; colNum < midRows.length; colNum++) {
            colCount = midRows[colNum].querySelectorAll('td').length;
            if(colCount > 0) {
                break;
            }
        }

        console.log("colCount", colCount);

        for (let col = 0; col < colCount; col++) { //colCount - количество колонок с данными в строке
            let isEmpty:boolean = true;
            for (let i = 0; i < midRows.length; i++) { //midRows.length - количество строк с данными
                //console.log("row cell", rows[i].querySelectorAll('td'));
                currentRow = midRows[i].querySelectorAll('td'); //получаем массив с нумерацией с 0, но без заголовков строк
                //console.log("currentRow", currentRow);
                if(currentRow.length > 0) { //В current row может не быть тегов <td>, это мы проверяем здесь
                    currentCell = currentRow[col];
                    //console.log("currentCell.innerHTML", currentCell.innerHTML);
                    const content = currentCell.innerText.replace('/&nbsp;/g', '').trim();
                        if (content !== '' && content !== 'undefined') {
                                    isEmpty = false;
                                    break;
                        }
                }
            }

            if(isEmpty && currentCell.className != "totalColumn") { //Проверяем, что это не ячейка из колонки с тоталами, т.к. тоталы мы скрываем отдельно
                    emptyIds.push(currentCell.id);
            }
        } 

        for (let cellIdNum = 0; cellIdNum < emptyIds.length; cellIdNum++) {
            let cellId = emptyIds[cellIdNum];
            const elementsToHide = datagrid.querySelectorAll(`[id="${cellId}"]`);
            elementsToHide.forEach((elem) => {
                elem.remove();
            });
        }


        let zeroLevelChildrenNum = colCount - emptyIds.length;

        for (let topRowNum = topRows.length - 1; topRowNum >= 0; topRowNum--) { //цикл обходит строки с заголовками от нижней строки к верхней
            //console.log(topRows[topRowNum]);
            //console.log(topRows[topRowNum].getAttribute('data-children-num'));
            if(parseInt(topRows[topRowNum].getAttribute('data-level')) == 0) { //если data-level равен 0, то присваиваем количеству потомков значение zeroLevelChildrenNum
                topRows[topRowNum].setAttribute('data-children-num', zeroLevelChildrenNum.toString());
            }
            else {
                let childrenNums = parseInt(topRows[topRowNum].getAttribute('data-children-num')); //получаем количество потомков у данного заголовка
                    if (childrenNums == 0 || typeof childrenNums === 'undefined') {
                        break;
                    }
                let currentHeadersColSpan = zeroLevelChildrenNum/childrenNums; //вычисляем нужный colspan на данной строке заголовка, который равен кол-ву потомков нулевого уровня, разделенному на кол-во потомков текущего уровня
                let headersOfColumns = topRows[topRowNum].getElementsByClassName('formatColumnNodes');

                for (let headerNum = 0; headerNum < headersOfColumns.length; headerNum++ ) {
                    console.log("headersOfColumns[headerNum]", headersOfColumns[headerNum]);
                    headersOfColumns[headerNum].setAttribute('colspan',currentHeadersColSpan.toString()); //проставляем нужный colspan
                }
            }
        }

    }
 }