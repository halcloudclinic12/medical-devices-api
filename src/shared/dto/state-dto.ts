export class StateDTO {
    _id: string;
    code: string;
    name: string;
    is_active: boolean;
    country_id: string;
    country_name: string;

    constructor(state: any) {
        this._id = state._id;
        this.code = state.code;
        this.name = state.name;
        this.is_active = state.is_active;
        this.country_id = state.country_id;
        this.country_name = state.country_name;
    }
}
