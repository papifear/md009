interface Country {
    name: string;
    code: string;
    capital: string;
    region: string;
    currency: {
        code: string;
        name: string;
        symbol: string;
    };
    language: {
        code: string;
        name: string;
    };
    flag: string;
    dialling_code: string;
    isoCode: string;
}

class CountryTable {
    private apiUrl: string;
    private selectElement: HTMLSelectElement | null;
    private entriesAmountSpan: HTMLSpanElement | null;
    private currentPage = 1;
    private limit: 5 | 10 | 20 = 5;
    private searchParams: Record<string, string> = {};
    private sortColumn: string | null = null;
    private sortDirection: 'asc' | 'desc' = 'asc';

    constructor(apiUrl: string) {
        this.apiUrl = apiUrl;
        this.selectElement = document.querySelector('select');
        this.entriesAmountSpan = document.querySelector('#entriesAmount');
    
        this.setupEventListeners();
        this.fetchData();
      }

    private setupEventListeners(): void {
        // entry limit select
        if (this.selectElement) {
            this.selectElement.addEventListener('change', this.handleSelectChange.bind(this));
        }
        // search inputs
        for (let i = 1; i <= 4; i++) {
            const input: HTMLInputElement | null = document.querySelector(`#input${i}`);
            if (input) {
                input.addEventListener('input', this.handleInput.bind(this, i));
            }
        }
        // prev & next buttons
        const prevButtonElement: HTMLButtonElement | null = document.querySelector('#prevButton');
        const nextButtonElement: HTMLButtonElement | null = document.querySelector('#nextButton');
        if (prevButtonElement && nextButtonElement) {
            prevButtonElement.addEventListener('click', this.handlePrevButtonClick.bind(this));
            nextButtonElement.addEventListener('click', this.handleNextButtonClick.bind(this));
        }
        // sortable columns
        const sortableColumns = document.querySelectorAll('.sortable-column');
        sortableColumns.forEach(column => {
            column.addEventListener('click', () => {
                const columnName = column.getAttribute('data-column');
                if (columnName) {
                    this.handleSortClick(columnName);
                }
            });
        });
    }

    // entry limit logic
    private handleSelectChange(event: Event): void {
        const selectedValue = (event.target as HTMLSelectElement).value;
        this.limit = Number(selectedValue) as 5 | 10 | 20;
        this.currentPage = 1;
        this.fetchData();
    }

    // search inputs
    private handleInput(index: number): void {
        const input = document.querySelector(`#input${index}`) as HTMLInputElement;
        const inputValue = input.value.trim();

        if (inputValue.length >= 2) {
            switch (index) {
                case 1:
                    this.searchParams = { name_like: inputValue };
                    break;
                case 2:
                    this.searchParams = { capital_like: inputValue };
                    break;
                case 3:
                    this.searchParams = { "currency.name_like": inputValue };
                    break;
                case 4:
                    this.searchParams = { "language.name_like": inputValue };
                    break;
                default:
                    break;
            }
        } else {
            // clear results if input is too short
            this.searchParams = {};
        }

        this.currentPage = 1;
        this.fetchData();
    }

    // get number of entries for the text above pagination buttons
    private async getNumberOfEntries(): Promise<number> {
        try {
            const response = await fetch(`${this.apiUrl}?_limit=1`);
            return Number(response.headers.get('X-Total-Count'));
        } catch (error) {
            console.error('Error fetching total amount of API entries:', error.message);
            return 0;
        }
    }

    // next & prev button logic
    private handlePrevButtonClick(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.fetchData();
        }
    }
    private async handleNextButtonClick(): Promise<void> {
        try {
            const totalEntries = await this.getNumberOfEntries();
            const totalPages = Math.ceil(totalEntries / this.limit);

            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.fetchData();
            }
        } catch (error) {
            console.error('Error handling next button click:', error.message);
        }
    }

    // column sorting logic 
    private handleSortClick(column: string): void {
        this.sortDirection = column === this.sortColumn ? (this.sortDirection === 'asc' ? 'desc' : 'asc') : 'asc';
        this.sortColumn = column;
    
        const sortableColumns = document.querySelectorAll('.sortable-column');
        sortableColumns.forEach(sortableColumn => {
            const icon = sortableColumn.querySelector('.sort-icon');
            if (icon) {
                icon.innerHTML = '↑↓';
            }
        });
    
        // update icon
        const clickedColumn = document.querySelector(`[data-column="${column}"]`);
        if (clickedColumn) {
            const icon = clickedColumn.querySelector('.sort-icon');
            if (icon) {
                icon.innerHTML = this.sortDirection === 'asc' ? '↑' : '↓';
            }
        }
    
        this.fetchData();
    }

    private async fetchData(): Promise<void> {
        try {
          const offset = (this.currentPage - 1) * this.limit;
          const baseApiUrl = `${this.apiUrl}?_limit=${this.limit}&_start=${offset}`;
          const apiUrlWithParams = this.buildApiUrl(baseApiUrl);
    
          const response = await fetch(apiUrlWithParams);
          const data = await response.json();
          this.renderItems(data);
    
          if (this.entriesAmountSpan) {
            const totalEntries = await this.getNumberOfEntries();
            this.entriesAmountSpan.innerHTML = `Showing ${offset + 1} to ${offset + this.limit} of ${totalEntries} Entries`;
          }
        } catch (error) {
          console.error('Error fetching data from API:', error.message);
        }
      }

    private buildApiUrl(baseApiUrl: string): string {
        let apiUrlWithParams = baseApiUrl;

        if (Object.keys(this.searchParams).length > 0) {
            apiUrlWithParams += `&${new URLSearchParams(this.searchParams).toString()}`;
        }

        if (this.sortColumn && this.sortDirection) {
            apiUrlWithParams += `&_sort=${this.sortColumn}&_order=${this.sortDirection}`;
        }

        return apiUrlWithParams;
    }

    private renderItems(countries: Country[]): void {
        const tBodyElement = document.querySelector('tbody');
        if (tBodyElement) {
            tBodyElement.innerHTML = '';

            countries.forEach(country => {
                const trElement = document.createElement('tr');

                trElement.innerHTML = `<tr>
                                        <td class="px-5 py-5 bg-white text-sm">
                                            <div class="flex items-center">
                                                <div class="flex-shrink-0 w-10 h-10">
                                                    <img class="w-full h-full rounded-full object-cover"
                                                        src="https://www.worldatlas.com/r/w425/img/flag/${country.code.toLocaleLowerCase()}-flag.jpg"
                                                        alt="" />
                                                </div>
                                                <div class="ml-3">
                                                    <p class="text-gray-900 whitespace-no-wrap">
                                                        ${country.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-5 py-5 bg-white text-sm">
                                            <p class="text-gray-900 whitespace-no-wrap">
                                                ${country.capital}
                                            </p>
                                        </td>
                                        <td class="px-5 py-5 bg-white text-sm">
                                            <p class="text-gray-900 whitespace-no-wrap">
                                                ${country.currency.name}
                                            </p>
                                        </td>
                                        <td class="px-5 py-5 bg-white text-sm">
                                            <p class="text-gray-900 whitespace-no-wrap">
                                                ${country.language.name}
                                            </p>
                                        </td>
                                    </tr>`;

                tBodyElement.appendChild(trElement);
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const countryTable = new CountryTable('http://localhost:3005/countries');
});