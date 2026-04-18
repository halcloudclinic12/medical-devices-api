import mongoose, { Schema } from "mongoose";
import { IBase } from 'shared/models/base-model';

/**************** Types ***********************/

interface ICity extends IBase {
    code: string,
    name: string,

    state_name: any,
    state_id: string,
    country_id: string,
    country_name: string,

    is_verified: boolean,
    is_test_account: boolean
}

/**************** Schema ***********************/

const citySchema = new Schema(
    {
        code: { type: String },
        name: { type: String },

        state_name: { type: String },
        country_name: { type: String },

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

        deleted_at: { type: Date },
        updated_at: { type: Date },
        is_active: { type: Boolean },
        is_deleted: { type: Boolean },
        created_at: { type: Date, index: true },
        unique_id: { type: String, required: true },
    }
);

const City = mongoose.model<ICity>("City", citySchema);

export { City, ICity };
