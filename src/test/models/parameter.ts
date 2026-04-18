import mongoose, { Schema } from "mongoose";
import { IBase } from "shared/models/base-model";

interface IRange {
    min: string,
    max: string,
    label: string,
    sort_order: number,
    description: string
}

interface IParameter extends IBase {
    name: string,
    unit: string,
    label: string,
    ranges: IRange[]
};

const ParameterValueSchema = new Schema(
    {
        name: { type: String, required: true },
        min: { type: String },
        max: { type: String },
        description: { type: String },
        label: { type: String, required: true },
        sort_order: { type: Number, default: 0 },

        created_at: { type: Date, index: true },
        updated_at: { type: Date },
        is_active: { type: Boolean },
        is_deleted: { type: Boolean },
        unique_id: { type: String, required: true },
    }
);

const ParameterSchema = new Schema(
    {
        name: { type: String, required: true },
        unit: { type: String },
        label: { type: String, required: true },
        test_type: { type: String, required: true },

        ranges: [ParameterValueSchema],

        created_at: { type: Date, index: true },
        updated_at: { type: Date },
        is_active: { type: Boolean },
        is_deleted: { type: Boolean },
        unique_id: { type: String, required: true },
    }
);

const Parameter = mongoose.model<IParameter>("Parameter", ParameterSchema);

export { Parameter, IParameter };
