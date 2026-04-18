import mongoose, { Schema } from "mongoose";
import { IBase } from 'shared/models/base-model';

/**************** Types ***********************/

interface IPatient extends IBase {
    otp: number,
    name: string,
    pin?: string,
    email: string,
    mobile: string,
    gender: string,
    password: string,
    username: string,
    last_name: string,
    image_file: string,
    first_name: string,
    app_version: string,
    blood_group: string,
    date_of_birth: Date,
    patient_token: string,

    clinic_id: string,

    is_verified: boolean,
    is_test_account: boolean
}

/**************** Schema ***********************/

const patientSchema = new Schema(
    {
        otp: { type: Number },
        pin: { type: String },
        name: { type: String },
        mobile: { type: String },
        password: { type: String },
        username: { type: String },
        last_name: { type: String },
        image_file: { type: String },
        first_name: { type: String },
        app_version: { type: String },
        blood_group: { type: String },
        date_of_birth: { type: Date },
        patient_token: { type: String },
        gender: { type: String, index: true },
        email: { type: String, unique: true, sparse: true },

        clinic_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Clinic',
            index: true,
        },

        customer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            index: true,
        },

        city_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'City',
            index: true,
        },

        state_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'State',
            index: true,
        },

        country_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Country',
            index: true,
        },

        is_verified: { type: Boolean, default: false },
        is_test_account: { type: Boolean, default: false },

        created_at: { type: Date, index: true },
        deleted_at: { type: Date },
        updated_at: { type: Date },
        is_active: { type: Boolean },
        is_deleted: { type: Boolean },
        unique_id: { type: String, required: true },
    }
);

const Patient = mongoose.model<IPatient>("Patient", patientSchema);

export { Patient, IPatient };
