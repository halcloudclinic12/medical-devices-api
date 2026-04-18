import mongoose from 'mongoose';

import ClinicService from 'clinic/services/clinic-service';
import PatientService from 'patient/services/patient-service';

export default class CityService {
    private readonly clinicService: ClinicService;
    private readonly patientService: PatientService;

    constructor() {
        this.clinicService = new ClinicService();
        this.patientService = new PatientService();
    }

    getClinic(data: any) {
        if (!data || !data.clinic_id) {
            return null;
        }

        return this.clinicService.findOne({ _id: mongoose.mongo.ObjectId.createFromHexString(data.clinic_id) }, null);
    }

    getPatient(data: any) {
        if (!data || !data.patient_id) {
            return null;
        }

        return this.patientService.findOne({ _id: mongoose.mongo.ObjectId.createFromHexString(data.patient_id) }, null);
    }
}