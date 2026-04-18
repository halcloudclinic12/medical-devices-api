import mongoose, { Schema } from "mongoose";
import { IBase } from "shared/models/base-model";

/**************** Types ***********************/

interface IPasswordReset {
    created_at: Date
}

interface IUser extends IBase {
    pin?: string,
    email: string,
    mobile: string,
    gender: string,
    role_id: string,
    password: string,
    username: string,
    last_name: string,
    fcm_token: string,
    user_type: string,
    image_file: string,
    first_name: string,
    date_of_birth: Date,
    customer_id?: string,
    creator_user_id: string,

    role: any,
    password_resets: IPasswordReset[],

    is_customer: boolean,
    is_verified: boolean,
    is_test_account: boolean,
    belongs_to_customer: boolean
}

/**************** Schema ***********************/

const PasswordResetSchema = new Schema(
    {
        created_at: { type: Date },
        expiry_date: { type: Date },
        is_active: { type: Boolean },
        forgot_password_token: { type: String, required: true },
    }
);

const UserSchema = new Schema(
    {
        pin: { type: String },
        mobile: { type: String },
        password: { type: String },
        username: { type: String },
        last_name: { type: String },
        fcm_token: { type: String },
        image_file: { type: String },
        gender: { type: String, index: true },
        email: { type: String, unique: true },
        date_of_birth: { type: Date, index: true },
        user_type: { type: String, required: true },
        first_name: { type: String, required: true },

        role_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            required: true,
            index: true,
        },

        creator_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        customer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },

        password_resets: [PasswordResetSchema],

        is_customer: { type: Boolean, default: false },
        is_verified: { type: Boolean, default: false },
        is_test_account: { type: Boolean, default: false },
        belongs_to_customer: { type: Boolean, default: false },

        updated_at: { type: Date },
        is_active: { type: Boolean },
        is_deleted: { type: Boolean },
        created_at: { type: Date, index: true },
        unique_id: { type: String, required: true },
    },
    {
        timestamps: true,
        collection: 'users'
    }
);

const User = mongoose.model<IUser>("User", UserSchema);

UserSchema.index({ gender: 1, date_of_birth: 1, created_at: 1 })

export { User, IUser, IPasswordReset };
