export class CityDTO {
    _id: string;
    code: string;
    name: string;
    state_id: string;
    country_name: any;
    country_id: string;
    state_name: string;
    is_active: boolean;

    constructor(city: any) {
        this._id = city._id;
        this.code = city.code;
        this.name = city.name;
        this.state_id = city.state_id;
        this.is_active = city.is_active;
        this.country_id = city.country_id;
        this.state_name = city.state_name;
        this.country_name = city.country_name;
    }
}
