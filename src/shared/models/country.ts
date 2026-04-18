import mongoose, { Schema } from "mongoose";
import { IBase } from 'shared/models/base-model';

/**************** Types ***********************/

interface ICountry extends IBase {
    code: string,
    name: string,

    is_verified: boolean,
    is_test_account: boolean
}

/**************** Schema ***********************/

const countrySchema = new Schema(
    {
        code: { type: String },
        name: { type: String },

        created_at: { type: Date, index: true },
        deleted_at: { type: Date },
        updated_at: { type: Date },
        is_active: { type: Boolean },
        is_deleted: { type: Boolean },
        unique_id: { type: String, required: true },
    }
);

const Country = mongoose.model<ICountry>("Country", countrySchema);

export { Country, ICountry };
