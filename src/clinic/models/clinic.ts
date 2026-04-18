import mongoose, { Schema } from "mongoose";
import { IBase } from 'shared/models/base-model';

/**************** Types ***********************/

interface IClinic extends IBase {
    name: string,
    email: string,
    address: string,
    city_id: string,
    password: string,
    state_id: string,
    clinic_id: string,
    country_id: string,
    customer_id: string,
    phone_number: string,
    date_of_establishment: Date,

    is_verified: boolean,
    is_test_account: boolean
}

/**************** Schema ***********************/

const clinicSchema = new Schema(
    {
        name: { type: String },
        email: {
            type: String,
            unique: true,
            sparse: true
        },
        address: { type: String },
        password: { type: String },
        username: { type: String },
        clinic_id: { type: String },
        last_name: { type: String },
        image_file: { type: String },
        date_of_birth: { type: Date },
        phone_number: { type: String },
        gender: { type: String, index: true },

        city_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'City',
            required: true
        },
        state_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'State',
            required: true
        },
        country_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Country',
            required: true
        },
        customer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        date_of_establishment: { type: Date },
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

const Clinic = mongoose.model<IClinic>("Clinic", clinicSchema);

export { Clinic, IClinic };
