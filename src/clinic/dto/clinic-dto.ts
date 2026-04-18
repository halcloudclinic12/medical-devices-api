export class ClinicDTO {
    _id: string;
    name: string;
    email: string;
    mobile: string;
    city_id: string;
    address: string;
    state_id: string;
    clinic_id: string;
    country_id: string;
    is_active: boolean;
    customer_id: string;
    is_verified: boolean;
    phone_number: string;
    is_test_account: boolean;
    date_of_establishment: string;

    city: any;
    state: any;
    country: any;

    constructor(clinic: any) {
        this._id = clinic._id;
        this.name = clinic.name;
        this.email = clinic.email;
        this.mobile = clinic.mobile;
        this.address = clinic.address;
        this.city_id = clinic.city_id;
        this.state_id = clinic.state_id;
        this.is_active = clinic.is_active;
        this.clinic_id = clinic.clinic_id;
        this.country_id = clinic.country_id;
        this.customer_id = clinic.customer_id;
        this.is_verified = clinic.is_verified;
        this.phone_number = clinic.phone_number;
        this.is_test_account = clinic.is_test_account;
        this.date_of_establishment = clinic.date_of_establishment;

        this.city = clinic.city;
        this.state = clinic.state;
        this.country = clinic.country;
    }
}
