import mongoose, { Schema } from "mongoose";
import { IBase } from "shared/models/base-model";

interface IRole extends IBase {
    name: string,
    status: boolean,
    unique_id: string,
    description: string,

    permissions: IRolePermission[]
};

interface IRolePermission {
    module: string,

    read: boolean,
    write: boolean,
    delete: boolean,

    unique_id: string
};

const RolePermissionSchema = new Schema(
    {
        module: { type: String, required: true },

        read: { type: Boolean, required: true },
        write: { type: Boolean, required: true },
        delete: { type: Boolean, required: true },

        created_at: { type: Date },
        updated_at: { type: Date },
        is_active: { type: Boolean },
        is_deleted: { type: Boolean },
        unique_id: { type: String, required: true },
    }
);

const RoleSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String },

        permissions: [RolePermissionSchema],

        created_at: { type: Date },
        updated_at: { type: Date },
        is_active: { type: Boolean },
        is_deleted: { type: Boolean },
        unique_id: { type: String, required: true },
    }
);

const Role = mongoose.model<IRole>("Role", RoleSchema);

export { Role, IRole, IRolePermission };
