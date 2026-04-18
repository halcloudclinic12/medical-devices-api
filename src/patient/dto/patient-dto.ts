export class PatientDTO {
    _id: string;
    clinic: any;
    name: string;
    email: string;
    gender: string;
    mobile: string;
    created_at: Date;
    last_name: string;
    first_name: string;
    image_file: string;
    app_version: string;
    date_of_birth: Date;
    blood_group: string;
    patient_token: string;

    constructor(patient: any) {
        this._id = patient._id;
        this.name = patient.name;
        this.email = patient.email;
        this.clinic = patient.clinic;
        this.gender = patient.gender;
        this.mobile = patient.mobile;
        this.last_name = patient.last_name;
        this.created_at = patient.created_at;
        this.first_name = patient.first_name;
        this.image_file = patient.image_file;
        this.app_version = patient.app_version;
        this.blood_group = patient.blood_group;
        this.date_of_birth = patient.date_of_birth;
        this.patient_token = patient.patient_token;
    }
}
