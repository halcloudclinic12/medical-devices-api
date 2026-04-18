// models/test.ts
import { Schema, model } from 'mongoose';

export type TestType = 'BASIC' | 'HBA1C' | 'LIPID';

const BaseTestSchema = new Schema(
    {
        // common metadata
        created_at: { type: Date, default: Date.now, index: true },
        updated_at: { type: Date },
        is_active: { type: Boolean, default: true, index: true },
        is_deleted: { type: Boolean, default: false, index: true },

        // identifiers / names used across your current models
        unique_id: { type: String, required: true }, // consider making idempotent, see index below

        // high-cardinality foreign keys (present in all three)
        customer_id: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
        clinic_id: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true, index: true },
        patient_id: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
        city_id: { type: Schema.Types.ObjectId, ref: 'City', required: true, index: true },
        state_id: { type: Schema.Types.ObjectId, ref: 'State', required: true, index: true },
        country_id: { type: Schema.Types.ObjectId, ref: 'Country', required: true, index: true },

        sync_id: { type: Number, default: null }, // already present in your models

        // Some extra data
        patient_data: {
            name: String,
            email: String,
            gender: String,
            mobile: String,
        },
        clinic_data: {
            name: String,
            code: String,
        },
    },
    {
        collection: 'tests',
        discriminatorKey: 'test_type', // 'BASIC' | 'HBA1C' | 'LIPID'
        minimize: true,
        strict: true,
    }
);

// -------------------- Production-grade indexes --------------------
// Common "feed" by patient (timeline):
BaseTestSchema.index({ patient_id: 1, is_active: 1, created_at: -1, _id: -1 });
// By clinic dashboard:
BaseTestSchema.index({ clinic_id: 1, is_active: 1, created_at: -1, _id: -1 });
// By customer (multi-tenant):
BaseTestSchema.index({ customer_id: 1, is_active: 1, created_at: -1, _id: -1 });
// Filter by type + patient:
BaseTestSchema.index({ test_type: 1, patient_id: 1, created_at: -1, _id: -1 });

// Idempotency / dedupe (external uniqueness). If unique_id is unique per (customer, clinic, patient, type):
BaseTestSchema.index(
    { customer_id: 1, clinic_id: 1, patient_id: 1, test_type: 1, unique_id: 1 },
    { unique: true, partialFilterExpression: { is_deleted: false } }
);

// Optional text/name search:
BaseTestSchema.index({ test_type: 1 });

// Export base
export const Test = model('Test', BaseTestSchema);

// -------------------- BASIC discriminator --------------------
const BasicSchema = new Schema({
    // include the "basic" metrics you currently store
    height: String, height_result: String,
    weight: String, weight_range: String, weight_result: String,
    physique: String, physique_range: String, health_score: String,
    temperature: String, temperature_result: String, temperature_range: String,

    bmi: String, bmi_range: String, bmi_result: String,
    bmr: String, bmr_range: String, bmr_result: String,

    blood_pressure_systolic: String, blood_pressure_systolic_result: String,
    blood_pressure_diastolic: String, blood_pressure_diastolic_result: String,

    bone_mass: String, bone_mass_range: String, bone_mass_result: String,
    skeletal_muscle: String, skeletal_muscle_range: String, skeletal_muscle_result: String,
    body_fat: String, body_fat_range: String, body_fat_result: String,
    lean_body_weight: String, lean_body_weight_range: String, lean_body_weight_result: String,
    fat_free_weight: String, fat_free_weight_result: String,
    subcutaneous_fat: String, subcutaneous_fat_range: String, subcutaneous_fat_result: String,
    visceral_fat: String, visceral_fat_range: String, visceral_fat_result: String,
    fat_level: String, control_weight: String,
    muscle_mass: String, muscle_mass_range: String, muscle_mass_result: String,
    muscle_rate: String, muscle_rate_range: String, muscle_rate_result: String,

    body_water: String, body_water_range: String, body_water_result: String,

    protein: String, protein_range: String, protein_result: String,
    oxygen: String, oxygen_range: String, oxygen_result: String,
    pulse: String, pulse_range: String, pulse_result: String,

    creatinine: String, creatinine_range: String, creatinine_result: String,
    bilirubin: String, bilirubin_range: String, bilirubin_result: String,
    hemoglobin: String, hemoglobin_range: String, hemoglobin_result: String,

    sugar: String, sugar_result: String, sugar_range: String,

    eye_left_result: String, eye_left_vision: String,
    eye_right_result: String, eye_right_vision: String, eye_range: String,

});
export const BasicTest = Test.discriminator('BASIC', BasicSchema);

// -------------------- HBA1C discriminator --------------------
const Hba1cSchema = new Schema({
    hba1c: String,
    hba1c_result: String,
});
export const Hba1cTest = Test.discriminator('HBA1C', Hba1cSchema);

// -------------------- LIPID discriminator --------------------
const LipidSchema = new Schema({
    tc: String, tg: String, hdl: String, ldl: String, tc_hdl: String,
    tc_result: String, tg_result: String, hdl_result: String, ldl_result: String, tc_hdl_result: String,
});
export const LipidTest = Test.discriminator('LIPID', LipidSchema);
