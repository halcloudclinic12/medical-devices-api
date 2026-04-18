import mongoose, { Schema } from "mongoose";
import { IBase } from 'shared/models/base-model';

/**************** Types ***********************/

interface IState extends IBase {
    code: string,
    name: string,

    country_id: string,
    country_name: { type: string },

    is_verified: boolean,
    is_test_account: boolean
}

/**************** Schema ***********************/

const stateSchema = new Schema(
    {
        code: { type: String },
        name: { type: String },
        country_name: { type: String },

        country_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Country',
            required: true
        },

        created_at: { type: Date, index: true },
        deleted_at: { type: Date },
        updated_at: { type: Date },
        is_active: { type: Boolean },
        is_deleted: { type: Boolean },
        unique_id: { type: String, required: true },
    }
);

const State = mongoose.model<IState>("State", stateSchema);

export { State, IState };
