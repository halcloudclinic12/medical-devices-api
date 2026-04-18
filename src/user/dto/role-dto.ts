export class RoleDTO {
    _id: string;
    name: string;
    created_at: string;
    updated_at: string;
    description: string;
    permissions: string;

    constructor(user: any) {
        this._id = user._id;
        this.name = user.name;
        this.created_at = user.created_at;
        this.updated_at = user.updated_at;
        this.description = user.description;
        this.permissions = user.permissions;
    }
}
