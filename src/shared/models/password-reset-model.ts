import { Schema } from "mongoose";

interface IPasswordReset {
    created_at: Date
}

const PasswordResetSchema = new Schema(
    {
        created_at: { type: Date },
        expiry_date: { type: Date },
        is_active: { type: Boolean },
        forgot_password_token: { type: String, required: true },
    }
);

export { IPasswordReset, PasswordResetSchema };
