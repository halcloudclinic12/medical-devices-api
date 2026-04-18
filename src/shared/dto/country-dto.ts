export class CountryDTO {
    _id: string;
    code: string;
    name: string;
    is_active: boolean;

    constructor(country: any) {
        this._id = country._id;
        this.code = country.code;
        this.name = country.name;
        this.is_active = country.is_active;
    }
}
