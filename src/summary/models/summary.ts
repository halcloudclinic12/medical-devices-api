import mongoose, { Schema } from "mongoose";

export interface IAgeGroupStats {
    total?: number;
    daily?: Record<string, number>;
    monthly?: Record<string, number>;
}

export interface IGenderAgeStats {
    total?: number;
    daily?: Record<string, number>;
    monthly?: Record<string, number>;
    age_group?: Record<string, IAgeGroupStats>;
}

export interface ITestStats {
    total?: number;
    daily?: Record<string, number>;
    monthly?: Record<string, number>;
    gender?: Record<string, IGenderAgeStats>;
    age_group?: Record<string, IAgeGroupStats>;
}

export interface ISummary {
    _id: string; // always 'global'
    updated_at: Date;

    tests: ITestStats;
    basic_tests: ITestStats;
    lipid_tests: ITestStats;
    hba1c_tests: ITestStats;
    patients: ITestStats;

    total_customers: number;
}

const TestStatsSchema = new Schema<ITestStats>(
    {
        total: { type: Number, default: 0 },
        daily: { type: Map, of: Number, default: {} },
        monthly: { type: Map, of: Number, default: {} },
        gender: {
            type: Map, of: new Schema({
                total: { type: Number, default: 0 },
                daily: { type: Map, of: Number, default: {} },
                monthly: { type: Map, of: Number, default: {} },
                age_group: {
                    type: Map,
                    of: new Schema({
                        total: { type: Number, default: 0 },
                        daily: { type: Map, of: Number, default: {} },
                        monthly: { type: Map, of: Number, default: {} },
                    }, { _id: false }),
                    default: {}
                }
            }, { _id: false }), default: {}
        },
        age_group: {
            type: Map,
            of: new Schema({
                total: { type: Number, default: 0 },
                daily: { type: Map, of: Number, default: {} },
                monthly: { type: Map, of: Number, default: {} },
            }, { _id: false }),
            default: {}
        }
    },
    { _id: false }
);

const SummarySchema = new Schema<ISummary>(
    {
        _id: { type: String, default: "global" },
        updated_at: { type: Date, default: Date.now },

        tests: { type: TestStatsSchema, default: () => ({}) },
        basic_tests: { type: TestStatsSchema, default: () => ({}) },
        lipid_tests: { type: TestStatsSchema, default: () => ({}) },
        hba1c_tests: { type: TestStatsSchema, default: () => ({}) },
        patients: { type: TestStatsSchema, default: () => ({}) },

        total_customers: { type: Number, default: 0 },
    },
    {
        collection: "summary",
        versionKey: false,
    }
);

const Summary = mongoose.model<ISummary>("Summary", SummarySchema);

export { Summary };
